package user

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID          uuid.UUID
	Email       string
	FirstName   string
	LastName    string
	Password    string
	Role        string
	Phone       string
	CreditScore int
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
