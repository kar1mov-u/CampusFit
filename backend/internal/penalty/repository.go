package penalty

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PenaltyRepository interface {
	CreatePenalty(ctx context.Context, data Penalty) error
	DeletePenalty(ctx context.Context, id uuid.UUID) error
	ListPenaltyForUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error)
	ListGivenPenaltyByUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error)
	ListPenaltiesInterval(ctx context.Context, start_date time.Time, end_date time.Time) ([]Penalty, error)
}

type PenaltyRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func (r *PenaltyRepositoryPostgres) CreatePenalty(ctx context.Context, data Penalty) error {

	//should deduct points by the user
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	defer tx.Rollback(ctx)

	//first deduct points
	query := `UPDATE users SET credit_score = credit_score - $1 WHERE user_id=$2`

	_, err = tx.Exec(ctx, query, data.Points, data.UserID)
	if err != nil {
		return fmt.Errorf("CreatePenalty: Failed to Deduct Points: %w", err)
	}

	//next, create row in the penalties table
	query = `INSERT INTO user_penalties (penalty_id, user_id, given_by_id, session_id, booking_id, reason, points, penalty_type) VALUES( $1, $2, $3, $4, $5, $6, $7, $8)`

	_, err = tx.Exec(ctx, query, data.ID, data.UserID, data.GivenByID, data.SessionID, data.BookingID, data.Reason, data.Points, data.PenaltyType)

	if err != nil {
		return fmt.Errorf("CreatePenalty: Failed to INSERT: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *PenaltyRepositoryPostgres) DeletePenalty(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	defer tx.Rollback(ctx)
	var userID uuid.UUID
	var points int
	query := `DELETE FROM user_penalties WHERE penalty_id=$1 RETURNING user_id, points`

	err = tx.QueryRow(ctx, query, id).Scan(&userID, &points)
	if err != nil {
		return fmt.Errorf("DeletePenalty: Failed to DELETE :%w", err)
	}

	query = `UPDATE users SET credit_score = credit_score+$1 WHERE user_id=$2`
	_, err = tx.Exec(ctx, query, points, userID)

	if err != nil {
		return fmt.Errorf("DeletePenalty: Failed to UPDATE :%w", err)
	}

	return tx.Commit(ctx)
}

func (r *PenaltyRepositoryPostgres) ListPenaltyForUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error) {
	query := `SELECT penalty_id, user_id, given_by_id,
	 COALESCE(session_id, '00000000-0000-0000-0000-000000000000'::uuid) AS session_id,
	 COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'::uuid) AS booking_id,
	reason, points, penalty_type, created_at, updated_at FROM user_penalties WHERE user_id=$1`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return []Penalty{}, fmt.Errorf("ListPenaltyForUser: Failed to SELECT :%w", err)
	}

	defer rows.Close()

	resp := make([]Penalty, 0)
	for rows.Next() {
		var p Penalty
		err := rows.Scan(&p.ID, &p.UserID, &p.GivenByID, &p.SessionID, &p.BookingID, &p.Reason, &p.Points, &p.PenaltyType, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return []Penalty{}, fmt.Errorf("ListPenaltyForUser: Failed to SCAN :%w", err)
		}
		resp = append(resp, p)
	}
	return resp, nil
}

func (r *PenaltyRepositoryPostgres) ListGivenPenaltyByUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error) {
	query := `SELECT penalty_id, user_id, given_by_id,
	 COALESCE(session_id, '00000000-0000-0000-0000-000000000000'::uuid) AS session_id,
	 COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'::uuid) AS booking_id,
	reason, points, penalty_type, created_at, updated_at FROM user_penalties WHERE given_by_id=$1`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return []Penalty{}, fmt.Errorf("ListGivenPenaltyByUser: Failed to SELECT :%w", err)
	}

	defer rows.Close()

	resp := make([]Penalty, 0)
	for rows.Next() {
		var p Penalty
		err := rows.Scan(&p.ID, &p.UserID, &p.GivenByID, &p.SessionID, &p.BookingID, &p.Reason, &p.Points, &p.PenaltyType, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return []Penalty{}, fmt.Errorf("ListGivenPenaltyByUser: Failed to SCAN :%w", err)
		}
		resp = append(resp, p)
	}
	return resp, nil
}

func (r *PenaltyRepositoryPostgres) ListPenaltiesInterval(ctx context.Context, start_date time.Time, end_date time.Time) ([]Penalty, error) {
	query := `SELECT penalty_id, user_id, given_by_id,
	 COALESCE(session_id, '00000000-0000-0000-0000-000000000000'::uuid) AS session_id,
	 COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'::uuid) AS booking_id,
	reason, points, penalty_type, created_at, updated_at FROM user_penalties WHERE created_at BETWEEN $1 AND $2`
	rows, err := r.pool.Query(ctx, query, start_date, end_date)
	if err != nil {
		return []Penalty{}, fmt.Errorf("ListPenaltiesInterval: Failed to SELECT :%w", err)
	}

	defer rows.Close()

	resp := make([]Penalty, 0)
	for rows.Next() {
		var p Penalty
		err := rows.Scan(&p.ID, &p.UserID, &p.GivenByID, &p.SessionID, &p.BookingID, &p.Reason, &p.Points, &p.PenaltyType, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return []Penalty{}, fmt.Errorf("ListPenaltiesInterval: Failed to SCAN :%w", err)
		}
		resp = append(resp, p)
	}
	return resp, nil
}
