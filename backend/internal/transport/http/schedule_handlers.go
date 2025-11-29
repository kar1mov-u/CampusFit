package http

import (
	"encoding/json"
	"net/http"
	"t/internal/transport/dto"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (s *Server) CreateScheduleHandler(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.logger.Error("Failed to decode request body", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid request body")
		return
	}

	if err := s.validator.Struct(req); err != nil {
		s.logger.Error("Validation failed", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Validation failed: "+err.Error())
		return
	}

	// Get trainer ID from context (assuming auth middleware sets it)
	userID, err := GetID(r.Context())
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if user is a trainer
	isTrainer := s.authService.IsTrainer(r.Context(), userID)
	if !isTrainer {
		http.Error(w, "User is not a trainer", http.StatusForbidden)
		return
	}

	scheduleData, err := req.ToDomain()
	if err != nil {
		s.logger.Error("Failed to convert to domain model", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid data format: "+err.Error())
		return
	}

	// Set the trainer ID to the authenticated user's ID
	// Note: In the current model, trainer_id is the same as user_id

	scheduleData.TrainerID = userID
	id, err := uuid.NewUUID()
	scheduleData.ID = id

	if err := s.scheduleService.CreateTrainingScehdule(r.Context(), *scheduleData); err != nil {
		s.logger.Error("Failed to create schedule", zap.Error(err))
		http.Error(w, "Failed to create schedule: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//create the sessions in the backgorund

	go func() {
		err = s.sessionService.CreateSessionsForNextWeeks(*scheduleData, 2)
		if err != nil {
			s.logger.Error("Failed to generate sessions for the schedule", zap.Error(err))
		}
		s.logger.Info("Successfully generated sessions for the schedule", zap.Error(err))

	}()

	respondWithJSON(w, http.StatusOK, nil, "Schedule created successfully")
}

func (s *Server) DeleteScheduleHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid schedule ID", http.StatusBadRequest)
		return
	}

	// TODO: Add authorization check to ensure the trainer owns this schedule

	if err := s.scheduleService.DeleteTrainingSchedule(r.Context(), id); err != nil {
		s.logger.Error("Failed to delete schedule", zap.Error(err))
		http.Error(w, "Failed to delete schedule", http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "Schedule deleted successfully")
}

func (s *Server) ListTrainerSchedulesHandler(w http.ResponseWriter, r *http.Request) {
	trainerIDStr := chi.URLParam(r, "trainer_id")
	trainerID, err := uuid.Parse(trainerIDStr)
	if err != nil {
		http.Error(w, "Invalid trainer ID", http.StatusBadRequest)
		return
	}

	schedules, err := s.scheduleService.ListSchedulesForTrainer(r.Context(), trainerID)
	if err != nil {
		s.logger.Error("Failed to list trainer schedules", zap.Error(err))
		http.Error(w, "Failed to list schedules", http.StatusInternalServerError)
		return
	}

	response := make([]dto.ScheduleResponse, len(schedules))
	for i, sch := range schedules {
		response[i] = dto.NewScheduleResponse(sch)
	}

	respondWithJSON(w, http.StatusOK, response, "successfully listed schedules")
}

func (s *Server) ListFacilitySchedulesHandler(w http.ResponseWriter, r *http.Request) {
	facilityIDStr := chi.URLParam(r, "facility_id")
	facilityID, err := uuid.Parse(facilityIDStr)
	if err != nil {
		http.Error(w, "Invalid facility ID", http.StatusBadRequest)
		return
	}

	schedules, err := s.scheduleService.ListSchedulesForFacility(r.Context(), facilityID)
	if err != nil {
		s.logger.Error("Failed to list facility schedules", zap.Error(err))
		http.Error(w, "Failed to list schedules", http.StatusInternalServerError)
		return
	}

	response := make([]dto.ScheduleResponse, len(schedules))
	for i, sch := range schedules {
		response[i] = dto.NewScheduleResponse(sch)
	}

	respondWithJSON(w, http.StatusOK, response, "successfully listed schedules")
}
