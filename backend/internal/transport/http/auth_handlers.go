package http

import (
	"encoding/json"
	"log"
	"net/http"
)

func (s *Server) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6,max=100"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid json")
		return
	}

	token, err := s.authService.LoginUser(r.Context(), req.Email, req.Password)
	if err != nil {
		log.Println(err)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create the JWT")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"token": token}, "logged in successfully")
}
