package trainer

import (
	"t/internal/user"
	"time"

	"github.com/google/uuid"
)

type Trainer struct {
	ID        uuid.UUID
	Bio       string
	Specialty string
	User      user.User
	CreatedAt time.Time
	UpdatedAt time.Time
}
