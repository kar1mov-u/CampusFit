package registration

import (
	"t/internal/session"
	"t/internal/user"
	"time"

	"github.com/google/uuid"
)

type Registration struct {
	ID         uuid.UUID
	SessionID  uuid.UUID
	UserID     uuid.UUID
	IsCanceled bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
	User       *user.User
	Session    *session.Session
}
