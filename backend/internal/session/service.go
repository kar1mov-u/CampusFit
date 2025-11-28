package session

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type SessionService struct {
	sessionRepo SessionRepository
}

func NewSessionService(r SessionRepository) *SessionService {
	return &SessionService{
		sessionRepo: r,
	}
}

func (s *SessionService) CreateSession(ctx context.Context, data Session) error {
	return s.sessionRepo.CreateSession(ctx, data)
}

func (s *SessionService) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return s.sessionRepo.DeleteSession(ctx, id)
}

func (s *SessionService) CancelSession(ctx context.Context, id uuid.UUID) error {
	return s.sessionRepo.CancelSession(ctx, id)
}

func (s *SessionService) ListFacilitySessions(ctx context.Context, facilityID uuid.UUID, date time.Time) ([]Session, error) {
	return s.sessionRepo.ListFacilitySessions(ctx, facilityID, date)
}

func (s *SessionService) ListTrainerSessions(ctx context.Context, trainerID uuid.UUID, date time.Time) ([]Session, error) {
	return s.sessionRepo.ListTrainerSessions(ctx, trainerID, date)
}
