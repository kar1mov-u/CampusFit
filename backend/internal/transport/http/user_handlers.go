package http

import (
	"encoding/json"
	"net/http"
	"t/internal/transport/dto"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (s *Server) CreateUserHandler(w http.ResponseWriter, r *http.Request) {

	//first read in to the DTO
	var createDto dto.CreateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&createDto); err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "failed to decode userInput")
		return
	}
	//validate the user input
	if err := s.validator.Struct(createDto); err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "malformed input")
		return
	}

	//need to hash password
	hashedPass, err := HashPassword(createDto.Password)
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to hash password")
		return
	}
	createDto.Password = hashedPass

	//convert to the domain model, to pass for the service layer
	userModel := createDto.ToModel()

	id, err := s.userService.CraeteUser(r.Context(), userModel)
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create user")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]uuid.UUID{"user_id": id}, "user created successfully")
}

func (s *Server) GetUserHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	user, err := s.userService.GetByID(r.Context(), id)
	if err != nil {
		respondWithJSON(w, http.StatusNotFound, nil, "user not found")
		return
	}

	//convert to the DTO
	var userResponse dto.UserResponseDTO
	userResponse.FromModel(user)

	respondWithJSON(w, http.StatusOK, userResponse, "user found")
}
