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

func NewPenaltyRepositoryPostgres(pool *pgxpool.Pool) PenaltyRepository {
	return &PenaltyRepositoryPostgres{pool: pool}
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

	// Handle nullable UUIDs - convert zero UUID to nil
	var sessionID interface{} = data.SessionID
	if data.SessionID == uuid.Nil {
		sessionID = nil
	}
	var bookingID interface{} = data.BookingID
	if data.BookingID == uuid.Nil {
		bookingID = nil
	}

	_, err = tx.Exec(ctx, query, data.ID, data.UserID, data.GivenByID, sessionID, bookingID, data.Reason, data.Points, data.PenaltyType)

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
	query := `
		SELECT 
			p.penalty_id, p.user_id, p.given_by_id,
			COALESCE(p.session_id, '00000000-0000-0000-0000-000000000000'::uuid) AS session_id,
			COALESCE(p.booking_id, '00000000-0000-0000-0000-000000000000'::uuid) AS booking_id,
			p.reason, p.points, p.penalty_type, p.created_at, p.updated_at,
			COALESCE(f_session.name, f_booking.name, '') as facility_name,
			ts.date as session_date,
			b.date as booking_date,
			COALESCE(
				CASE WHEN p.session_id IS NOT NULL THEN 'Training Session' ELSE NULL END,
				CASE WHEN p.booking_id IS NOT NULL THEN 'Facility Booking' ELSE NULL END,
				'General'
			) as context_info
		FROM user_penalties p
		LEFT JOIN trainer_sessions ts ON p.session_id = ts.session_id
		LEFT JOIN facilities f_session ON ts.facility_id = f_session.facility_id
		LEFT JOIN bookings b ON p.booking_id = b.booking_id
		LEFT JOIN facilities f_booking ON b.facility_id = f_booking.facility_id
		WHERE p.user_id=$1
		ORDER BY p.created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return []Penalty{}, fmt.Errorf("ListPenaltyForUser: Failed to SELECT :%w", err)
	}

	defer rows.Close()

	resp := make([]Penalty, 0)
	for rows.Next() {
		var p Penalty
		err := rows.Scan(
			&p.ID, &p.UserID, &p.GivenByID, &p.SessionID, &p.BookingID,
			&p.Reason, &p.Points, &p.PenaltyType, &p.CreatedAt, &p.UpdatedAt,
			&p.FacilityName, &p.SessionDate, &p.BookingDate, &p.ContextInfo,
		)
		if err != nil {
			return []Penalty{}, fmt.Errorf("ListPenaltyForUser: Failed to SCAN :%w", err)
		}
		resp = append(resp, p)
	}
	return resp, nil
}

func (r *PenaltyRepositoryPostgres) ListGivenPenaltyByUser(ctx context.Context, userID uuid.UUID) ([]Penalty, error) {
	query := `
		SELECT 
			p.penalty_id, p.user_id, p.given_by_id,
			COALESCE(p.session_id, '00000000-0000-0000-0000-000000000000'::uuid) AS session_id,
			COALESCE(p.booking_id, '00000000-0000-0000-0000-000000000000'::uuid) AS booking_id,
			p.reason, p.points, p.penalty_type, p.created_at, p.updated_at,
			COALESCE(f_session.name, f_booking.name, '') as facility_name,
			ts.date as session_date,
			b.date as booking_date,
			COALESCE(
				CASE WHEN p.session_id IS NOT NULL THEN 'Training Session' ELSE NULL END,
				CASE WHEN p.booking_id IS NOT NULL THEN 'Facility Booking' ELSE NULL END,
				'General'
			) as context_info,
			u.first_name || ' ' || u.last_name as user_name
		FROM user_penalties p
		JOIN users u ON p.user_id = u.user_id
		LEFT JOIN trainer_sessions ts ON p.session_id = ts.session_id
		LEFT JOIN facilities f_session ON ts.facility_id = f_session.facility_id
		LEFT JOIN bookings b ON p.booking_id = b.booking_id
		LEFT JOIN facilities f_booking ON b.facility_id = f_booking.facility_id
		WHERE p.given_by_id=$1
		ORDER BY p.created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return []Penalty{}, fmt.Errorf("ListGivenPenaltyByUser: Failed to SELECT :%w", err)
	}

	defer rows.Close()

	resp := make([]Penalty, 0)
	for rows.Next() {
		var p Penalty
		err := rows.Scan(
			&p.ID, &p.UserID, &p.GivenByID, &p.SessionID, &p.BookingID,
			&p.Reason, &p.Points, &p.PenaltyType, &p.CreatedAt, &p.UpdatedAt,
			&p.FacilityName, &p.SessionDate, &p.BookingDate, &p.ContextInfo,
			&p.UserName,
		)
		if err != nil {
			return []Penalty{}, fmt.Errorf("ListGivenPenaltyByUser: Failed to SCAN :%w", err)
		}
		resp = append(resp, p)
	}
	return resp, nil
}

func (r *PenaltyRepositoryPostgres) ListPenaltiesInterval(ctx context.Context, start_date time.Time, end_date time.Time) ([]Penalty, error) {
	query := `
		SELECT 
			p.penalty_id, p.user_id, p.given_by_id,
			COALESCE(p.session_id, '00000000-0000-0000-0000-000000000000'::uuid) AS session_id,
			COALESCE(p.booking_id, '00000000-0000-0000-0000-000000000000'::uuid) AS booking_id,
			p.reason, p.points, p.penalty_type, p.created_at, p.updated_at,
			COALESCE(f_session.name, f_booking.name, '') as facility_name,
			ts.date as session_date,
			b.date as booking_date,
			COALESCE(
				CASE WHEN p.session_id IS NOT NULL THEN 'Training Session' ELSE NULL END,
				CASE WHEN p.booking_id IS NOT NULL THEN 'Facility Booking' ELSE NULL END,
				'General'
			) as context_info
		FROM user_penalties p
		LEFT JOIN trainer_sessions ts ON p.session_id = ts.session_id
		LEFT JOIN facilities f_session ON ts.facility_id = f_session.facility_id
		LEFT JOIN bookings b ON p.booking_id = b.booking_id
		LEFT JOIN facilities f_booking ON b.facility_id = f_booking.facility_id
		WHERE p.created_at BETWEEN $1 AND $2
		ORDER BY p.created_at DESC`

	rows, err := r.pool.Query(ctx, query, start_date, end_date)
	if err != nil {
		return []Penalty{}, fmt.Errorf("ListPenaltiesInterval: Failed to SELECT :%w", err)
	}

	defer rows.Close()

	resp := make([]Penalty, 0)
	for rows.Next() {
		var p Penalty
		err := rows.Scan(
			&p.ID, &p.UserID, &p.GivenByID, &p.SessionID, &p.BookingID,
			&p.Reason, &p.Points, &p.PenaltyType, &p.CreatedAt, &p.UpdatedAt,
			&p.FacilityName, &p.SessionDate, &p.BookingDate, &p.ContextInfo,
		)
		if err != nil {
			return []Penalty{}, fmt.Errorf("ListPenaltiesInterval: Failed to SCAN :%w", err)
		}
		resp = append(resp, p)
	}
	return resp, nil
}
