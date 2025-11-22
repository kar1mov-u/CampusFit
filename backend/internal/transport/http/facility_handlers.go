package http

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"t/internal/transport/dto"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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

func (s *Server) UpdateFacilityHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	facilID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var updateDTO dto.UpdateFacilityDTO

	if err := json.NewDecoder(r.Body).Decode(&updateDTO); err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid input")
		return
	}
	fmt.Println(updateDTO)

	//check if its admin
	userID, err := GetID(r.Context())
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "cannot get id ")
		return
	}

	if !s.authService.IsAdmin(r.Context(), userID) {
		respondWithJSON(w, http.StatusForbidden, nil, "need admin access")
		return
	}

	//load original from the DB
	facil, err := s.facilityService.GetFacility(r.Context(), facilID)
	if err != nil {
		respondWithJSON(w, http.StatusNotFound, nil, "")
		return
	}

	err = updateDTO.ApplyToFacility(&facil)
	if err != nil {
		log.Println("cannot convert from updateFacility")
		respondWithJSON(w, http.StatusInternalServerError, w, "server error")
		return
	}

	fmt.Println(facil)

	err = s.facilityService.UpdateFacility(r.Context(), facil)
	if err != nil {
		log.Println(err)
		respondWithJSON(w, http.StatusInternalServerError, nil, "fucked up")
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "updated successfully")

}

func (s *Server) GetFacilityHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	facilID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	facil, err := s.facilityService.GetFacility(r.Context(), facilID)
	if err != nil {
		respondWithJSON(w, http.StatusNotFound, nil, "facility not found")
	}

	var resp dto.FacilityResponseDTO
	resp.ToDTO(facil)
	respondWithJSON(w, http.StatusOK, resp, "facility found")
}

func (s *Server) ListFacilitiesHandler(w http.ResponseWriter, r *http.Request) {

	facils, err := s.facilityService.ListFacilities(r.Context())
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to get facilites")
		return
	}
	resp := make([]dto.FacilityResponseDTO, 0)

	for _, f := range facils {
		var i dto.FacilityResponseDTO
		i.ToDTO(f)
		resp = append(resp, i)
	}

	respondWithJSON(w, http.StatusOK, resp, "")
}

func (s *Server) DeleteFacilityHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	facilID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	//check if its admin
	userID, err := GetID(r.Context())
	if err != nil {
		respondWithJSON(w, http.StatusInternalServerError, nil, "cannot get id ")
		return
	}

	if !s.authService.IsAdmin(r.Context(), userID) {
		respondWithJSON(w, http.StatusForbidden, nil, "need admin access")
		return
	}

	err = s.facilityService.DeleteFacility(r.Context(), facilID)
	if err != nil {

		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to delete")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "")
}
