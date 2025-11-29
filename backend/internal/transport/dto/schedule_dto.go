package dto

import (
	"fmt"
	"t/internal/schedule"
	"time"

	"github.com/google/uuid"
)

type CreateScheduleRequest struct {
	FacilityID uuid.UUID `json:"facility_id" validate:"required"`
	WeekDay    int       `json:"weekday" validate:"required,min=0,max=6"`
	StartTime  string    `json:"start_time" validate:"required"` // Format: "15:04"
	EndTime    string    `json:"end_time" validate:"required"`   // Format: "15:04"
	Capacity   int       `json:"capacity" validate:"required,min=1"`
}

func (req *CreateScheduleRequest) ToDomain() (*schedule.Schedule, error) {
	startTime, err := time.Parse("15:04", req.StartTime)
	if err != nil {
		return nil, fmt.Errorf("invalid start_time format: %w", err)
	}
	endTime, err := time.Parse("15:04", req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("invalid end_time format: %w", err)
	}

	return &schedule.Schedule{
		FacilityID: req.FacilityID,
		WeekDay:    req.WeekDay,
		StartTime:  startTime,
		EndTime:    endTime,
		Capacity:   req.Capacity,
	}, nil
}

type ScheduleResponse struct {
	ID         uuid.UUID `json:"id"`
	TrainerID  uuid.UUID `json:"trainer_id"`
	FacilityID uuid.UUID `json:"facility_id"`
	WeekDay    int       `json:"weekday"`
	StartTime  string    `json:"start_time"`
	EndTime    string    `json:"end_time"`
	Capacity   int       `json:"capacity"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func NewScheduleResponse(s schedule.Schedule) ScheduleResponse {
	return ScheduleResponse{
		ID:         s.ID,
		TrainerID:  s.TrainerID,
		FacilityID: s.FacilityID,
		WeekDay:    s.WeekDay,
		StartTime:  s.StartTime.Format("15:04"),
		EndTime:    s.EndTime.Format("15:04"),
		Capacity:   s.Capacity,
		IsActive:   s.IsActive,
		CreatedAt:  s.CreatedAt,
		UpdatedAt:  s.UpdatedAt,
	}
}
