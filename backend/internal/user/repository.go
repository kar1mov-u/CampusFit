package user

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepostiory interface {
	GetByID(context.Context, uuid.UUID) (User, error)
	GetByEmail(context.Context, string) (uuid.UUID, string, error)
	CreateUser(context.Context, User) (uuid.UUID, error)
	DeleteUser(context.Context, uuid.UUID) bool
	UpdateUser(context.Context, User) (User, error)
	GetRole(context.Context, uuid.UUID) (string, error)
	ListUsers(ctx context.Context, email string, offset int) ([]User, error)
}

//----------------------- this is the implementation of the userRepo, for now i just have 1 , so can keep in the same file, later might change

type UserRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewUserRepositotyPostgres(pl *pgxpool.Pool) *UserRepositoryPostgres {
	return &UserRepositoryPostgres{pool: pl}
}

func (u *UserRepositoryPostgres) GetByID(ctx context.Context, id uuid.UUID) (User, error) {
	var user User

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
		return User{}, fmt.Errorf("userRepository.GetByID: %w", err)
	}

	return user, nil
}

func (u *UserRepositoryPostgres) CreateUser(ctx context.Context, user User) (uuid.UUID, error) {

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

func (u *UserRepositoryPostgres) GetByEmail(ctx context.Context, email string) (uuid.UUID, string, error) {
	var id uuid.UUID
	var hash string

	query := `
		SELECT 
			user_id, password
		FROM users 
		WHERE email = $1
	`
	err := u.pool.QueryRow(ctx, query, email).Scan(&id, &hash)

	if err != nil {
		return uuid.UUID{}, "", fmt.Errorf("userRepositoy.GetByEmail :%w", err)
	}

	return id, hash, nil

}

func (u *UserRepositoryPostgres) ListUsers(ctx context.Context, email string, offset int) ([]User, error) {
	query := `SELECT user_id, email, first_name, last_name, password,
			 phone, credit_score, role, is_active, created_at, updated_at
			FROM users
			WHERE ($1 = '' OR email ILIKE '%' || $1 || '%' OR first_name ILIKE '%' || $1 || '%')
			ORDER BY created_at DESC
			OFFSET $2
			LIMIT  $3`

	rows, err := u.pool.Query(ctx, query, email, offset, 20)
	if err != nil {
		return []User{}, fmt.Errorf("repository.ListUsers Falied to qeury users %w", err)
	}
	defer rows.Close()

	resp := make([]User, 0)
	for rows.Next() {
		var user User
		err := rows.Scan(
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
			return []User{}, fmt.Errorf("repository.LitsUsers Failed to scan rows :%w", err)
		}
		resp = append(resp, user)
	}
	return resp, nil

}

func (u *UserRepositoryPostgres) DeleteUser(ctx context.Context, id uuid.UUID) bool {
	return false
}
func (u *UserRepositoryPostgres) UpdateUser(ctx context.Context, user User) (User, error) {
	return User{}, nil
}

func (u *UserRepositoryPostgres) GetRole(ctx context.Context, id uuid.UUID) (string, error) {
	var role string

	query := `SELECT role FROM users WHERE user_id=$1`

	err := u.pool.QueryRow(ctx, query, id).Scan(&role)
	if err != nil {
		return "", err
	}
	return role, nil
}
