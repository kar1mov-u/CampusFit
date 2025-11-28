package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"t/internal/transport/dto"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// this handler will be called by admin to promote the user to be trainer, request payload will consist of just userID, after promotion trainer itself can set up its account's other details
func (s *Server) CreateTrainerHandler(w http.ResponseWriter, r *http.Request) {

	//read the request payload
	var req struct {
		UserID string `json:"user_id" validate:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.logger.Warn("Cannot decode user input", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "malformed input")
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		s.logger.Warn("userID is not valid UUID", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid format of userID. Expected UUID")
		return
	}

	//check if the user is admin
	isAdmin, err := s.isAdmin(r.Context())
	if err != nil {
		s.logger.Warn("failed on checking admin permissions", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failure on checking admin permissions")
		return
	}
	if !isAdmin {
		respondWithJSON(w, http.StatusForbidden, nil, "required admin access")
		return
	}

	//call the service layer
	if err := s.trainerService.CreateTrainer(r.Context(), userID); err != nil {
		s.logger.Warn("failed to create the trainer", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create the trainer")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "successfully created trainer")
}

func (s *Server) GetTrainerHandler(w http.ResponseWriter, r *http.Request) {
	// Get trainer ID from URL parameter
	trainerIDStr := chi.URLParam(r, "id")
	if trainerIDStr == "" {
		s.logger.Warn("Missing trainer ID in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "Missing trainer ID")
		return
	}

	trainerID, err := uuid.Parse(trainerIDStr)
	if err != nil {
		s.logger.Warn("Invalid trainer ID format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid trainer ID format")
		return
	}

	trainer, err := s.trainerService.GetTrainer(r.Context(), trainerID)
	if err != nil {
		s.logger.Error("Failed to get trainer", zap.Error(err))
		respondWithJSON(w, http.StatusNotFound, nil, "Trainer not found")
		return
	}

	responseDto := dto.ToTrainerResponseDTO(trainer)
	respondWithJSON(w, http.StatusOK, responseDto, "Trainer retrieved successfully")
}

func (s *Server) ListTrainersHandler(w http.ResponseWriter, r *http.Request) {
	// Get offset from query parameter
	offsetStr := r.URL.Query().Get("offset")
	offset := 0
	if offsetStr != "" {
		var err error
		offset, err = strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			s.logger.Warn("Invalid offset parameter", zap.Error(err))
			respondWithJSON(w, http.StatusBadRequest, nil, "Invalid offset parameter")
			return
		}
	}

	trainers, err := s.trainerService.ListTrainers(r.Context(), offset)
	if err != nil {
		s.logger.Error("Failed to list trainers", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list trainers")
		return
	}

	responseDtos := make([]dto.TrainerResponseDTO, 0, len(trainers))
	for _, trainer := range trainers {
		responseDtos = append(responseDtos, dto.ToTrainerResponseDTO(trainer))
	}

	respondWithJSON(w, http.StatusOK, responseDtos, "Trainers retrieved successfully")
}

func (s *Server) UpdateTrainerHandler(w http.ResponseWriter, r *http.Request) {
	// Get trainer ID from URL parameter
	trainerIDStr := chi.URLParam(r, "id")
	if trainerIDStr == "" {
		s.logger.Warn("Missing trainer ID in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "Missing trainer ID")
		return
	}

	trainerID, err := uuid.Parse(trainerIDStr)
	if err != nil {
		s.logger.Warn("Invalid trainer ID format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid trainer ID format")
		return
	}

	// Decode request body
	var updateDto dto.TrainerUpdateDTO
	if err := json.NewDecoder(r.Body).Decode(&updateDto); err != nil {
		s.logger.Warn("Failed to decode request body", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Failed to decode request body")
		return
	}

	// Validate
	if err := s.validator.Struct(updateDto); err != nil {
		s.logger.Warn("Validation failed", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Validation failed")
		return
	}

	// Check if the requesting user is the trainer themselves or an admin
	requestingUserID, err := GetID(r.Context())
	if err != nil {
		s.logger.Error("Failed to get user ID from context", zap.Error(err))
		respondWithJSON(w, http.StatusUnauthorized, nil, "Unauthorized")
		return
	}

	isAdmin, _ := s.isAdmin(r.Context())
	if !isAdmin && requestingUserID != trainerID {
		respondWithJSON(w, http.StatusForbidden, nil, "You can only update your own trainer profile")
		return
	}

	trainer := updateDto.ToModel()
	trainer.ID = trainerID

	if err := s.trainerService.UpdateTrainer(r.Context(), trainer); err != nil {
		s.logger.Error("Failed to update trainer", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to update trainer")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "Trainer updated successfully")
}

func (s *Server) DeleteTrainerHandler(w http.ResponseWriter, r *http.Request) {
	// Get trainer ID from URL parameter
	trainerIDStr := chi.URLParam(r, "id")
	if trainerIDStr == "" {
		s.logger.Warn("Missing trainer ID in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "Missing trainer ID")
		return
	}

	trainerID, err := uuid.Parse(trainerIDStr)
	if err != nil {
		s.logger.Warn("Invalid trainer ID format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid trainer ID format")
		return
	}

	// Check if user is admin
	isAdmin, err := s.isAdmin(r.Context())
	if err != nil {
		s.logger.Error("Failed to check if user is admin", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to check admin permissions")
		return
	}
	if !isAdmin {
		respondWithJSON(w, http.StatusForbidden, nil, "Admin access required")
		return
	}

	if err := s.trainerService.DeleteTrainer(r.Context(), trainerID); err != nil {
		s.logger.Error("Failed to delete trainer", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to delete trainer")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "Trainer deleted successfully")
}
