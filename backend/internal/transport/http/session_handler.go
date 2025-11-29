package http

import (
	"encoding/json"
	"net/http"
	"t/internal/transport/dto"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (s *Server) ListFacilitySessionsHandler(w http.ResponseWriter, r *http.Request) {
	facilityIDStr := chi.URLParam(r, "facility_id")
	facilityID, err := uuid.Parse(facilityIDStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid facility ID")
		return
	}

	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		respondWithJSON(w, http.StatusBadRequest, nil, "Date parameter is required")
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid date format, expected YYYY-MM-DD")
		return
	}

	sessions, err := s.sessionService.ListFacilitySessions(r.Context(), facilityID, date)
	if err != nil {
		s.logger.Error("Failed to list facility sessions", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list sessions")
		return
	}

	response := make([]dto.SessionResponse, len(sessions))
	for i, sess := range sessions {
		response[i] = dto.NewSessionResponse(sess)
	}

	respondWithJSON(w, http.StatusOK, response, "Successfully listed sessions")
}

func (s *Server) CreateSessionHandler(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateSessionRequest
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

	sessionData, err := req.ToDomain()
	if err != nil {
		s.logger.Error("Failed to convert to domain model", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid data format: "+err.Error())
		return
	}

	// Ensure ID is generated
	sessionData.ID = uuid.New()

	if err := s.sessionService.CreateSession(r.Context(), *sessionData); err != nil {
		s.logger.Error("Failed to create session", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to create session")
		return
	}

	respondWithJSON(w, http.StatusCreated, nil, "Session created successfully")
}

func (s *Server) DeleteSessionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid session ID")
		return
	}

	if err := s.sessionService.DeleteSession(r.Context(), id); err != nil {
		s.logger.Error("Failed to delete session", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to delete session")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "Session deleted successfully")
}

func (s *Server) CancelSessionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid session ID")
		return
	}

	if err := s.sessionService.CancelSession(r.Context(), id); err != nil {
		s.logger.Error("Failed to cancel session", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to cancel session")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "Session canceled successfully")
}

func (s *Server) ListTrainerSessionsHandler(w http.ResponseWriter, r *http.Request) {
	trainerIDStr := chi.URLParam(r, "trainer_id")
	trainerID, err := uuid.Parse(trainerIDStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid trainer ID")
		return
	}

	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		respondWithJSON(w, http.StatusBadRequest, nil, "Date parameter is required")
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid date format, expected YYYY-MM-DD")
		return
	}

	sessions, err := s.sessionService.ListTrainerSessions(r.Context(), trainerID, date)
	if err != nil {
		s.logger.Error("Failed to list trainer sessions", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list sessions")
		return
	}

	response := make([]dto.SessionResponse, len(sessions))
	for i, sess := range sessions {
		response[i] = dto.NewSessionResponse(sess)
	}

	respondWithJSON(w, http.StatusOK, response, "Successfully listed sessions")
}
