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

func (s *Server) CreateFacilityReviewHandler(w http.ResponseWriter, r *http.Request) {
	// Get the facility ID from the path parameter
	facilityIDStr := chi.URLParam(r, "facility_id")
	if facilityIDStr == "" {
		s.logger.Warn("missing facility_id in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "missing facility_id")
		return
	}

	// Validate facility ID format
	_, err := uuid.Parse(facilityIDStr)
	if err != nil {
		s.logger.Warn("invalid facility_id format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid facility_id format")
		return
	}

	// Decode the request body
	var createDto dto.FacilityReviewCreateDTO
	if err := json.NewDecoder(r.Body).Decode(&createDto); err != nil {
		s.logger.Warn("failed to decode user input", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "failed to decode request body")
		return
	}

	// Override facility_id from path parameter (more secure than trusting body)
	createDto.FacilityID = facilityIDStr

	// Validate the input
	if err := s.validator.Struct(createDto); err != nil {
		s.logger.Warn("invalid user input",
			zap.Error(err),
			zap.Any("payload", createDto),
		)
		respondWithJSON(w, http.StatusBadRequest, nil, "validation failed: rating must be 1-5, comment must be at least 3 characters")
		return
	}

	// Get the user ID from context
	userID, err := GetID(r.Context())
	if err != nil {
		s.logger.Warn("invalid userID from context", zap.Error(err))
		respondWithJSON(w, http.StatusUnauthorized, nil, "unauthorized: invalid user")
		return
	}

	// Convert DTO to domain model
	reviewModel, err := createDto.ToModel(userID)
	if err != nil {
		s.logger.Warn("failed to convert to domain model", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "failed to process review data")
		return
	}

	// Call service layer
	err = s.reviewService.CreateFacilityReview(r.Context(), reviewModel)
	if err != nil {
		s.logger.Error("failed to create facility review",
			zap.Error(err),
			zap.String("facility_id", facilityIDStr),
			zap.String("user_id", userID.String()),
		)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create review")
		return
	}

	s.logger.Info("facility review created successfully",
		zap.String("facility_id", facilityIDStr),
		zap.String("user_id", userID.String()),
	)
	respondWithJSON(w, http.StatusCreated, nil, "review created successfully")
}

func (s *Server) DeleteFacilityReviewHandler(w http.ResponseWriter, r *http.Request) {
	// Get the review ID from the path parameter
	reviewIDStr := chi.URLParam(r, "review_id")
	if reviewIDStr == "" {
		s.logger.Warn("missing review_id in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "missing review_id")
		return
	}

	// Parse and validate review ID
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		s.logger.Warn("invalid review_id format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid review_id format")
		return
	}

	// Get the user ID from context (for logging and potential authorization)
	userID, err := GetID(r.Context())
	if err != nil {
		s.logger.Warn("invalid userID from context", zap.Error(err))
		respondWithJSON(w, http.StatusUnauthorized, nil, "unauthorized: invalid user")
		return
	}

	// Call service layer to delete the review
	err = s.reviewService.DeleteFacilityReview(r.Context(), reviewID)
	if err != nil {
		s.logger.Error("failed to delete facility review",
			zap.Error(err),
			zap.String("review_id", reviewIDStr),
			zap.String("user_id", userID.String()),
		)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to delete review")
		return
	}

	s.logger.Info("facility review deleted successfully",
		zap.String("review_id", reviewIDStr),
		zap.String("user_id", userID.String()),
	)
	respondWithJSON(w, http.StatusOK, nil, "review deleted successfully")
}

func (s *Server) GetFacilityReviewsHandler(w http.ResponseWriter, r *http.Request) {
	// Get the facility ID from the path parameter
	facilityIDStr := chi.URLParam(r, "facility_id")
	if facilityIDStr == "" {
		s.logger.Warn("missing facility_id in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "missing facility_id")
		return
	}

	// Parse and validate facility ID
	facilityID, err := uuid.Parse(facilityIDStr)
	if err != nil {
		s.logger.Warn("invalid facility_id format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid facility_id format")
		return
	}

	// Get offset from query parameters (for pagination)
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		s.logger.Warn("invalid offset parameter", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "offset must be an integer")
		return
	}

	// Validate offset is non-negative
	if offset < 0 {
		s.logger.Warn("negative offset provided", zap.Int("offset", offset))
		respondWithJSON(w, http.StatusBadRequest, nil, "offset must be non-negative")
		return
	}

	// Call service layer to get reviews
	reviews, err := s.reviewService.GetFacilityReviews(r.Context(), facilityID, offset)
	if err != nil {
		s.logger.Error("failed to get facility reviews",
			zap.Error(err),
			zap.String("facility_id", facilityIDStr),
			zap.Int("offset", offset),
		)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to retrieve reviews")
		return
	}

	// Convert to response DTOs
	responseDto := dto.ToFacilityReviewList(reviews)

	s.logger.Info("facility reviews retrieved successfully",
		zap.String("facility_id", facilityIDStr),
		zap.Int("count", len(reviews)),
		zap.Int("offset", offset),
	)
	respondWithJSON(w, http.StatusOK, responseDto, "reviews retrieved successfully")
}

func (s *Server) GetFacilityRatingHandler(w http.ResponseWriter, r *http.Request) {
	// Get the facility ID from the path parameter
	facilityIDStr := chi.URLParam(r, "facility_id")
	if facilityIDStr == "" {
		s.logger.Warn("missing facility_id in path parameter")
		respondWithJSON(w, http.StatusBadRequest, nil, "missing facility_id")
		return
	}

	// Parse and validate facility ID
	facilityID, err := uuid.Parse(facilityIDStr)
	if err != nil {
		s.logger.Warn("invalid facility_id format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid facility_id format")
		return
	}

	// Call service layer to get average rating
	rating, err := s.reviewService.GetFacilityRating(r.Context(), facilityID)
	if err != nil {
		s.logger.Error("failed to get facility rating",
			zap.Error(err),
			zap.String("facility_id", facilityIDStr),
		)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to retrieve rating")
		return
	}

	// Create response with rating
	response := map[string]interface{}{
		"facility_id":    facilityIDStr,
		"average_rating": rating,
	}

	s.logger.Info("facility rating retrieved successfully",
		zap.String("facility_id", facilityIDStr),
		zap.Float64("rating", rating),
	)
	respondWithJSON(w, http.StatusOK, response, "rating retrieved successfully")
}
