package booking

import (
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	FacilityID uuid.UUID
	Date       time.Time // date only (no time)
	StartTime  time.Time // time-only
	EndTime    time.Time // time-only
	Note       string
	IsCanceled bool
	AdminNote  string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
