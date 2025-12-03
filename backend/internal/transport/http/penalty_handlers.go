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

func (s *Server) CreatePenaltyHandler(w http.ResponseWriter, r *http.Request) {
	//first get the input
	var req dto.CreatePenaltyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.logger.Error("Failed to Decode input", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Malformed Input")
		return
	}
	//validate
	if err := s.validator.Struct(req); err != nil {
		s.logger.Error("Failed to Valide input", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Failed to validate"+err.Error())
		return
	}

	//check user is admin or trainer
	isAdmin, _ := s.isAdmin(r.Context())
	isTrainer, _ := s.isTrainer(r.Context())
	if !isAdmin && !isTrainer {
		respondWithJSON(w, http.StatusForbidden, nil, "Access Denied")
		return
	}

	//set the givenByID to current users ID
	userID, err := GetID(r.Context())
	if err != nil {
		s.logger.Error("Failed to get UserID", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Failed to get UserID")
		return
	}

	reqModel := req.ToModel()
	reqModel.ID = uuid.New()
	reqModel.GivenByID = userID

	//call the serivede
	err = s.penaltyService.CreatePenalty(r.Context(), reqModel)
	if err != nil {
		s.logger.Error("Failed To CreatePenalty", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create penalty")
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "successfully created penalty")

}

func (s *Server) DeletePenaltyHandler(w http.ResponseWriter, r *http.Request) {
	//check if admin or trainer
	isAdmin, _ := s.isAdmin(r.Context())
	isTrainer, _ := s.isTrainer(r.Context())

	if !isAdmin && !isTrainer {
		respondWithJSON(w, http.StatusForbidden, nil, "Access Denied")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		s.logger.Error("Failed to parse ID", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid ID")
		return
	}

	// If not admin, check if the penalty was given by the current user
	if !isAdmin {
		// We need to fetch the penalty first to check ownership
		// Since we don't have a GetPenalty method, we can list penalties given by user and check if ID exists
		// Or better, we can trust the service/repo to handle this check, but for now let's do a quick check here
		// A more robust way would be to add GetPenalty to service/repo, but to minimize changes:
		// We will proceed with deletion, but we should ideally verify ownership.
		// However, given the constraints, let's assume the frontend only shows delete button for owned penalties
		// and we can add a check in the repository if needed.
		// For now, let's just allow trainers to call delete.
		// TODO: Add ownership check in service/repo layer for better security
	}

	// Actually, let's add a check here using ListGivenPenaltyByUser
	if !isAdmin {
		userID, _ := GetID(r.Context())
		penalties, err := s.penaltyService.ListGivenPenaltyByUser(r.Context(), userID)
		if err != nil {
			s.logger.Error("Failed to list given penalties for ownership check", zap.Error(err))
			respondWithJSON(w, http.StatusInternalServerError, nil, "Internal Server Error")
			return
		}

		found := false
		for _, p := range penalties {
			if p.ID == id {
				found = true
				break
			}
		}

		if !found {
			respondWithJSON(w, http.StatusForbidden, nil, "You can only delete penalties you created")
			return
		}
	}

	err = s.penaltyService.DeletePenalty(r.Context(), id)
	if err != nil {
		s.logger.Error("Failed to delete penalty", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to delete penalty")
		return
	}

	respondWithJSON(w, http.StatusOK, nil, "successfully deleted penalty")
}

func (s *Server) ListPenaltyForUserHandler(w http.ResponseWriter, r *http.Request) {
	//check if admin or the user themselves
	userIDStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		s.logger.Error("Failed to parse ID", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid ID")
		return
	}

	currentUserID, _ := GetID(r.Context())
	isAdmin, _ := s.isAdmin(r.Context())

	if currentUserID != userID && !isAdmin {
		respondWithJSON(w, http.StatusForbidden, nil, "Access Denied")
		return
	}

	penalties, err := s.penaltyService.ListPenaltyForUser(r.Context(), userID)
	if err != nil {
		s.logger.Error("Failed to list penalties", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list penalties")
		return
	}

	var resp []dto.PenaltyResponse
	for _, p := range penalties {
		var d dto.PenaltyResponse
		d.FromModel(p)
		resp = append(resp, d)
	}

	respondWithJSON(w, http.StatusOK, resp, "successfully listed penalties")
}

func (s *Server) ListGivenPenaltyByUserHandler(w http.ResponseWriter, r *http.Request) {
	//check if admin or trainer
	isAdmin, _ := s.isAdmin(r.Context())
	isTrainer, _ := s.isTrainer(r.Context())

	if !isAdmin && !isTrainer {
		respondWithJSON(w, http.StatusForbidden, nil, "Access Denied")
		return
	}

	userIDStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		s.logger.Error("Failed to parse ID", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid ID")
		return
	}

	penalties, err := s.penaltyService.ListGivenPenaltyByUser(r.Context(), userID)
	if err != nil {
		s.logger.Error("Failed to list given penalties", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list given penalties")
		return
	}

	var resp []dto.PenaltyResponse
	for _, p := range penalties {
		var d dto.PenaltyResponse
		d.FromModel(p)
		resp = append(resp, d)
	}

	respondWithJSON(w, http.StatusOK, resp, "successfully listed given penalties")
}

func (s *Server) ListPenaltiesIntervalHandler(w http.ResponseWriter, r *http.Request) {
	//check if admin
	isAdmin, _ := s.isAdmin(r.Context())
	if !isAdmin {
		respondWithJSON(w, http.StatusForbidden, nil, "Access Denied")
		return
	}

	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid start date format (YYYY-MM-DD)")
		return
	}

	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		respondWithJSON(w, http.StatusBadRequest, nil, "Invalid end date format (YYYY-MM-DD)")
		return
	}

	penalties, err := s.penaltyService.ListPenaltiesInterval(r.Context(), start, end)
	if err != nil {
		s.logger.Error("Failed to list penalties interval", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "Failed to list penalties interval")
		return
	}

	var resp []dto.PenaltyResponse
	for _, p := range penalties {
		var d dto.PenaltyResponse
		d.FromModel(p)
		resp = append(resp, d)
	}

	respondWithJSON(w, http.StatusOK, resp, "successfully listed penalties interval")
}
