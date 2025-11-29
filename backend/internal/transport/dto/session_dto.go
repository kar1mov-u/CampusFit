package dto

import (
	"fmt"
	"t/internal/session"
	"time"

	"github.com/google/uuid"
)

type CreateSessionRequest struct {
	ScheduleID uuid.UUID `json:"schedule_id" validate:"required"`
	TrainerID  uuid.UUID `json:"trainer_id" validate:"required"`
	FacilityID uuid.UUID `json:"facility_id" validate:"required"`
	Date       string    `json:"date" validate:"required"`       // Format: "2006-01-02"
	StartTime  string    `json:"start_time" validate:"required"` // Format: "15:04"
	EndTime    string    `json:"end_time" validate:"required"`   // Format: "15:04"
	Capacity   int       `json:"capacity" validate:"required,min=1"`
}

func (req *CreateSessionRequest) ToDomain() (*session.Session, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format: %w", err)
	}
	startTime, err := time.Parse("15:04", req.StartTime)
	if err != nil {
		return nil, fmt.Errorf("invalid start_time format: %w", err)
	}
	endTime, err := time.Parse("15:04", req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("invalid end_time format: %w", err)
	}

	return &session.Session{
		ScheduleID: req.ScheduleID,
		TrainerID:  req.TrainerID,
		FacilityID: req.FacilityID,
		Date:       date,
		StartTime:  startTime,
		EndTime:    endTime,
		Capacity:   req.Capacity,
	}, nil
}

type SessionResponse struct {
	ID              uuid.UUID `json:"id"`
	ScheduleID      uuid.UUID `json:"schedule_id"`
	TrainerID       uuid.UUID `json:"trainer_id"`
	FacilityID      uuid.UUID `json:"facility_id"`
	Date            string    `json:"date"`
	StartTime       string    `json:"start_time"`
	EndTime         string    `json:"end_time"`
	Capacity        int       `json:"capacity"`
	IsCanceled      bool      `json:"is_canceled"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	RegisteredCount int       `json:"registered_count"`
}

func NewSessionResponse(s session.Session) SessionResponse {
	return SessionResponse{
		ID:              s.ID,
		ScheduleID:      s.ScheduleID,
		TrainerID:       s.TrainerID,
		FacilityID:      s.FacilityID,
		Date:            s.Date.Format("2006-01-02"),
		StartTime:       s.StartTime.Format("15:04"),
		EndTime:         s.EndTime.Format("15:04"),
		Capacity:        s.Capacity,
		IsCanceled:      s.IsCanceled,
		CreatedAt:       s.CreatedAt,
		UpdatedAt:       s.UpdatedAt,
		RegisteredCount: s.RegisteredCount,
	}
}
