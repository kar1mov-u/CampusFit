package schedule

import (
	"time"

	"github.com/google/uuid"
)

type Schedule struct {
	ID         uuid.UUID
	TrainerID  uuid.UUID
	FacilityID uuid.UUID
	WeekDay    int
	StartTime  time.Time
	EndTime    time.Time
	Capacity   int
	IsActive   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
