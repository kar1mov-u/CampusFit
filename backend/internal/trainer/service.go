package trainer

import (
	"context"

	"github.com/google/uuid"
)

type TrainerService struct {
	trainerRepo TrainerRepository
}

func NewTrainerService(repo TrainerRepository) *TrainerService {
	return &TrainerService{
		trainerRepo: repo,
	}
}

func (s *TrainerService) CreateTrainer(ctx context.Context, userID uuid.UUID) error {
	return s.trainerRepo.CreateTrainer(ctx, userID)
}

func (s *TrainerService) UpdateTrainer(ctx context.Context, data Trainer) error {
	return s.trainerRepo.UpdateTrainer(ctx, data)
}

func (s *TrainerService) DeleteTrainer(ctx context.Context, id uuid.UUID) error {
	return s.trainerRepo.DeleteTrainer(ctx, id)
}

func (s *TrainerService) GetTrainer(ctx context.Context, id uuid.UUID) (Trainer, error) {
	return s.trainerRepo.GetTrainer(ctx, id)
}

func (s *TrainerService) ListTrainers(ctx context.Context, offset int) ([]Trainer, error) {
	return s.trainerRepo.ListTrainers(ctx, offset)
}
