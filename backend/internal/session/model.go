package session

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID         uuid.UUID
	ScheduleID uuid.UUID
	TrainerID  uuid.UUID
	FacilityID uuid.UUID
	Date       time.Time
	StartTime  time.Time
	EndTime    time.Time
	Capacity   int
	IsCanceled bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
