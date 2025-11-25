package review

import (
	"context"

	"github.com/google/uuid"
)

type ReviewService struct {
	reviewRepo ReviewRepository
}

func NewReviewService(rep ReviewRepository) *ReviewService {
	return &ReviewService{
		reviewRepo: rep,
	}
}

func (s *ReviewService) CreateFacilityReview(ctx context.Context, f FacilityReview) error {
	return s.reviewRepo.CreateFacilityReview(ctx, f)
}

func (s *ReviewService) DeleteFacilityReview(ctx context.Context, id uuid.UUID) error {
	return s.reviewRepo.DeleteFacilityReview(ctx, id)
}

func (s *ReviewService) GetFacilityRating(ctx context.Context, id uuid.UUID) (float64, error) {
	return s.reviewRepo.GetFacilityRating(ctx, id)
}

func (s *ReviewService) GetFacilityReviews(ctx context.Context, id uuid.UUID, offset int) ([]FacilityReview, error) {
	return s.reviewRepo.GetFacilityReviews(ctx, id, offset)
}
