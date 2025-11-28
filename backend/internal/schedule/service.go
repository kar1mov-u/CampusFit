package schedule

import (
	"context"

	"github.com/google/uuid"
)

type ScheduleService struct {
	scheduleRepo ScheduleRepository
}

func NewScheduleService(r ScheduleRepository) *ScheduleService {
	return &ScheduleService{
		scheduleRepo: r,
	}
}

func (s *ScheduleService) CreateTrainingScehdule(ctx context.Context, data Schedule) error {
	return s.scheduleRepo.CreateTrainingScehdule(ctx, data)
}

func (s *ScheduleService) DeleteTrainingSchedule(ctx context.Context, id uuid.UUID) error {
	return s.scheduleRepo.DeleteTrainingSchedule(ctx, id)
}

func (s *ScheduleService) ListSchedulesForTrainer(ctx context.Context, trainerID uuid.UUID) ([]Schedule, error) {
	return s.scheduleRepo.ListSchedulesForTrainer(ctx, trainerID)
}

func (s *ScheduleService) ListSchedulesForFacility(ctx context.Context, facilityID uuid.UUID) ([]Schedule, error) {
	return s.scheduleRepo.ListSchedulesForFacility(ctx, facilityID)
}
