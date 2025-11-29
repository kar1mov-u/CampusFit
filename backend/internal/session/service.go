package session

import (
	"context"
	"t/internal/schedule"
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

// for the next n weeks we it will create sessions
func (s *SessionService) CreateSessionsForNextWeeks(schedule schedule.Schedule, weeks int) error {
	days := NextWeekdays(schedule.WeekDay, 2)

	session := Session{
		ScheduleID: schedule.ID,
		TrainerID:  schedule.TrainerID,
		FacilityID: schedule.FacilityID,
		StartTime:  schedule.StartTime,
		EndTime:    schedule.EndTime,
		Capacity:   schedule.Capacity,
		IsCanceled: false,
	}
	for _, day := range days {
		var i Session
		i = session
		id, _ := uuid.NewUUID()
		i.ID = id
		i.Date = day
		err := s.CreateSession(context.TODO(), i)
		if err != nil {
			return err
		}
	}
	return nil

}

func NextWeekdays(weekday int, count int) []time.Time {
	now := time.Now()
	results := make([]time.Time, 0, count)

	// Convert int → time.Weekday
	target := time.Weekday((weekday) % 7) // because Go uses 0=Sunday, 1=Monday

	// current weekday relative to Go's system
	currentWeekday := now.Weekday()

	// Calculate days until next target day
	// Monday=1 in Go, but you want Monday=0 → above conversion handles this
	daysUntil := (int(target) - int(currentWeekday) + 7) % 7

	// // If it's today — skip to next week
	// if daysUntil == 0 {
	// 	daysUntil = 7
	// }

	// First date
	next := now.AddDate(0, 0, daysUntil)
	results = append(results, next)

	// Next occurrences (each +7 days)
	for i := 1; i < count; i++ {
		next = next.AddDate(0, 0, 7)
		results = append(results, next)
	}

	return results
}
