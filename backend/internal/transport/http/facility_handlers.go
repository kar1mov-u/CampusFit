package http

import (
	"encoding/json"
	"net/http"
	"t/internal/transport/dto"
)

func (s *Server) CreateFacilityHandler(w http.ResponseWriter, r *http.Request) {
	//first get the user input
	var createReq dto.CreateFacilityDTO
	if err := json.NewDecoder(r.Body).Decode(&createReq); err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "falied to decode")
		return
	}

	//validate for the fields
	if err := s.validator.Struct(createReq); err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "malformed input")
		return
	}

	//get the userID, it will be injected into ctx after passing JWT middleware
	id, err := GetID(r.Context())
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "userID not found")
		return
	}

	//check if the user is admin
	if !s.authService.IsAdmin(r.Context(), id) {
		respondWithJSON(w, http.StatusForbidden, nil, "user is not admin")
		return
	}

	//convert to domain type and call for the facility service
	f, err := createReq.ToModel()
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "cannot convert to model")
		return
	}

	err = s.facilityService.CreateFacility(r.Context(), f)
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "cannot create facility")
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "facility craeted")
}
