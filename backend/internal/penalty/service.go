package penalty

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type PenaltyService struct {
	penaltyRepo PenaltyRepository
}

func NewPenaltyService(r PenaltyRepository) *PenaltyService {
	return &PenaltyService{
		penaltyRepo: r,
	}
}

func (s *PenaltyService) CreatePenalty(ctx context.Context, data Penalty) error {
	return s.penaltyRepo.CreatePenalty(ctx, data)
}

func (s *PenaltyService) DeletePenalty(ctx context.Context, id uuid.UUID) error {
	return s.penaltyRepo.DeletePenalty(ctx, id)
}

func (s *PenaltyService) ListPenaltyForUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error) {
	return s.penaltyRepo.ListPenaltyForUser(ctx, userID)
}

func (s *PenaltyService) ListGivenPenaltyByUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error) {
	return s.penaltyRepo.ListGivenPenaltyByUser(ctx, userID)
}

func (s *PenaltyService) ListPenaltiesInterval(ctx context.Context, start, end time.Time) ([]Penalty, error) {
	return s.penaltyRepo.ListPenaltiesInterval(ctx, start, end)
}
