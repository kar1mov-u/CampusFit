package repository

import (
	"context"
	"t/internal/models"

	"github.com/google/uuid"
)

type UserRepostiory interface {
	GetByID(context.Context, uuid.UUID) (models.User, error)
	CreateUser(context.Context, models.User) (uuid.UUID, error)
	DeleteUser(context.Context, uuid.UUID) bool
	UpdateUser(context.Context, models.User) (models.User, error)
}
