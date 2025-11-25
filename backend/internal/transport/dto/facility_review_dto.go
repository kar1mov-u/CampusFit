package dto

import (
	"fmt"
	"t/internal/review"
	"time"

	"github.com/google/uuid"
)

type FacilityReviewCreateDTO struct {
	FacilityID string `json:"facility_id" validate:"required,uuid4"`
	Rating     int    `json:"rating" validate:"required,min=1,max=5"`
	Comment    string `json:"comment" validate:"required,min=3"`
}

type FacilityReviewResponseDTO struct {
	ID         string    `json:"id"`
	FacilityID string    `json:"facility_id"`
	UserID     string    `json:"user_id"`
	Rating     int       `json:"rating"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

func (d *FacilityReviewCreateDTO) ToModel(userID uuid.UUID) (review.FacilityReview, error) {
	facilID, err := uuid.Parse(d.FacilityID)
	if err != nil {
		return review.FacilityReview{}, fmt.Errorf("invalid facility_id: %w", err)
	}

	return review.FacilityReview{
		ID:         uuid.New(),
		FacilityID: facilID,
		UserID:     userID,
		Comment:    d.Comment,
		Rating:     d.Rating,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}, nil
}

func (r *FacilityReviewResponseDTO) FromModel(m review.FacilityReview) {
	r.ID = m.ID.String()
	r.FacilityID = m.FacilityID.String()
	r.UserID = m.UserID.String()
	r.Rating = m.Rating
	r.Comment = m.Comment
	r.CreatedAt = m.CreatedAt
}

func ToFacilityReviewList(models []review.FacilityReview) []FacilityReviewResponseDTO {
	resp := make([]FacilityReviewResponseDTO, 0, len(models))

	for _, m := range models {
		var dto FacilityReviewResponseDTO
		dto.FromModel(m)
		resp = append(resp, dto)
	}

	return resp
}
