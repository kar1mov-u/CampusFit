package penalty

import (
	"time"

	"github.com/google/uuid"
)

type Penalty struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	GivenByID   uuid.UUID
	SessionID   uuid.UUID
	BookingID   uuid.UUID
	Reason      string
	Points      int
	PenaltyType string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
