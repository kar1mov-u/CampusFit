package http

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

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

func GetID(ctx context.Context) (uuid.UUID, error) {
	str := ctx.Value("userID").(string)
	return uuid.Parse(str)

}

func (s *Server) isAdmin(ctx context.Context) (bool, error) {
	id, err := GetID(ctx)
	if err != nil {
		return false, err
	}

	//check if the user is admin
	if !s.authService.IsAdmin(ctx, id) {
		return false, nil
	}
	return true, nil
}

func (s *Server) isTrainer(ctx context.Context) (bool, error) {
	id, err := GetID(ctx)
	if err != nil {
		return false, err
	}

	//check if the user is trainer
	if !s.authService.IsTrainer(ctx, id) {
		return false, nil
	}
	return true, nil
}
