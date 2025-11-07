package postgres

import (
	"t/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepostioryPostgres struct {
	pool *pgxpool.Pool
}

func (u *UserRepostioryPostgres) GetUser(id string) (models.User, error) {
	return models.User{}, nil
}

func (u *UserRepostioryPostgres) CreateUser(models.User) (string, error) {
	return "", nil
}
func (u *UserRepostioryPostgres) DeleteUser(id string) bool {
	return false
}
func (u *UserRepostioryPostgres) UpdateUser(models.User) (models.User, error) {
	return models.User{}, nil
}
