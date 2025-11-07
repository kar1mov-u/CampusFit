package repository

import (
	"t/internal/models"
)

type UserRepostiory interface {
	GetUser(id string) (models.User, error)
	CreateUser(models.User) (string, error)
	DeleteUser(id string) bool
	UpdateUser(models.User) (models.User, error)
}
