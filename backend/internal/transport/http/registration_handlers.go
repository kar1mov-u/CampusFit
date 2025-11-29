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

func (s *Server) CreateRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateRegistrationRequest
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

	userID, err := GetID(r.Context())
	if err != nil {
		respondWithJSON(w, http.StatusUnauthorized, nil, "Unauthorized")
		return
	}

	registrationData := req.ToDomain(userID)
	// Ensure ID is generated
	registrationData.ID = uuid.New()

	if err := s.registrationService.CreateRegistration(r.Context(), registrationData); err != nil {
		s.logger.Error("Failed to create registration", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to create registration: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, nil, "Registration created successfully")
}

func (s *Server) CancelRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid registration ID")
		return
	}

	if err := s.registrationService.CancelRegistration(r.Context(), id); err != nil {
		s.logger.Error("Failed to cancel registration", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to cancel registration")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "Registration canceled successfully")
}

func (s *Server) ListSessionRegistrationsHandler(w http.ResponseWriter, r *http.Request) {
	sessionIDStr := chi.URLParam(r, "session_id")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid session ID")
		return
	}

	registrations, err := s.registrationService.ListRegistrationsForSession(r.Context(), sessionID)
	if err != nil {
		s.logger.Error("Failed to list session registrations", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list registrations")
		return
	}

	response := make([]dto.RegistrationResponse, len(registrations))
	for i, reg := range registrations {
		response[i] = dto.NewRegistrationResponse(reg)
	}

	respondWithJSON(w, http.StatusOK, response, "Successfully listed registrations")
}

func (s *Server) ListUserRegistrationsHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid user ID")
		return
	}

	offsetStr := r.URL.Query().Get("offset")
	offset := 0
	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			respondWithJSON(w, http.StatusBadRequest, nil, "Invalid offset")
			return
		}
	}

	registrations, err := s.registrationService.ListRegistrationsForUser(r.Context(), userID, offset)
	if err != nil {
		s.logger.Error("Failed to list user registrations", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list registrations")
		return
	}

	response := make([]dto.RegistrationResponse, len(registrations))
	for i, reg := range registrations {
		response[i] = dto.NewRegistrationResponse(reg)
	}

	respondWithJSON(w, http.StatusOK, response, "Successfully listed registrations")
}
