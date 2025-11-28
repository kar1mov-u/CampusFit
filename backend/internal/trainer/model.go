package trainer

import (
	"time"

	"github.com/google/uuid"
)

type Trainer struct {
	ID        uuid.UUID
	Bio       string
	Specialty string
	CreatedAt time.Time
	UpdatedAt time.Time
}
