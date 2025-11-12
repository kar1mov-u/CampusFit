package http

import (
	"encoding/json"
	"log"
	"net/http"
	"t/internal/transport/dto"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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
	log.Println(err)
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create user")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]uuid.UUID{"user_id": id}, "user created successfully")
}

type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
}

func respondWithJSON(w http.ResponseWriter, status int, body any, message string) {
	w.Header().Set("Content-type", "application/json")
	w.WriteHeader(status)

	resp := Response{
		Success: status < 400,
		Message: message,
		Data:    body,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, `{"success":false,"message":"failed to encode response"}`, http.StatusInternalServerError)
		return
	}
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a plaintext password with a bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
