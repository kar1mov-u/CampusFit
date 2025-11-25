package review

import (
	"time"

	"github.com/google/uuid"
)

type FacilityReview struct {
	ID         uuid.UUID
	FacilityID uuid.UUID
	UserID     uuid.UUID
	Comment    string
	Rating     int
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
