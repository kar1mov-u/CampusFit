package facility

import (
	"time"

	"github.com/google/uuid"
)

type Facility struct {
	ID          uuid.UUID
	Name        string
	Type        string
	Description string
	Capacity    int
	OpenTime    time.Time
	CloseTime   time.Time
	ImageURL    string
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
