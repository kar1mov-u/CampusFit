package postgres

import (
	"context"
	"fmt"
	"t/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewUserRepositotyPostgres(pl *pgxpool.Pool) *UserRepositoryPostgres {
	return &UserRepositoryPostgres{pool: pl}
}

func (u *UserRepositoryPostgres) GetByID(ctx context.Context, id uuid.UUID) (models.User, error) {
	var user models.User

	query := `
		SELECT 
			user_id, email, first_name, last_name, password,
			 phone, credit_score, role, is_active, created_at, updated_at
		FROM users 
		WHERE user_id = $1
	`

	err := u.pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.Password,
		&user.Phone,
		&user.CreditScore,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return models.User{}, fmt.Errorf("userRepository.GetByID: %w", err)
	}

	return user, nil
}

func (u *UserRepositoryPostgres) CreateUser(ctx context.Context, user models.User) (uuid.UUID, error) {

	var newID uuid.UUID

	query := `
		INSERT INTO users (
			email, first_name, last_name, password,
			 phone, credit_score, role, is_active
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING user_id
	`

	err := u.pool.QueryRow(
		ctx,
		query,
		user.Email,
		user.FirstName,
		user.LastName,
		user.Password,
		user.Phone,
		user.CreditScore,
		user.Role,
		user.IsActive,
	).Scan(&newID)

	if err != nil {
		return uuid.UUID{}, fmt.Errorf("repostiory.CreateUser :%w", err)
	}

	return newID, nil
}

func (u *UserRepositoryPostgres) DeleteUser(ctx context.Context, id uuid.UUID) bool {
	return false
}
func (u *UserRepositoryPostgres) UpdateUser(ctx context.Context, user models.User) (models.User, error) {
	return models.User{}, nil
}
