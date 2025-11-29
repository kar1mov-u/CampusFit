package registration

import (
	"context"
	"fmt"
	"log"
	"t/internal/session"
	"t/internal/user"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RegistrationRepository interface {
	CreateRegistration(ctx context.Context, tx pgx.Tx, data Registration) error
	CheckForFreeSpot(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) bool

	CancelRegistration(ctx context.Context, tx pgx.Tx, registerID uuid.UUID) error
	ListRegistrationsForSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) ([]Registration, error)
	ListRegistrationsForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID, offset int) ([]Registration, error)
	CheckIfUserRegistered(ctx context.Context, tx pgx.Tx, sessionID, userID uuid.UUID) (bool, error)
	BeginTx(ctx context.Context) (pgx.Tx, error)
}

type RegistrationRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewRegistrationRepositoryPostgres(p *pgxpool.Pool) *RegistrationRepositoryPostgres {
	return &RegistrationRepositoryPostgres{pool: p}
}

func (r *RegistrationRepositoryPostgres) BeginTx(ctx context.Context) (pgx.Tx, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{
		IsoLevel: pgx.Serializable,
	})
	return tx, err
}

func (r *RegistrationRepositoryPostgres) execRow(ctx context.Context, tx pgx.Tx, q string, args ...any) pgx.Row {
	if tx != nil {
		return tx.QueryRow(ctx, q, args...)
	}
	return r.pool.QueryRow(ctx, q, args...)
}

func (r *RegistrationRepositoryPostgres) execRows(ctx context.Context, tx pgx.Tx, q string, args ...any) (pgx.Rows, error) {
	if tx != nil {
		return tx.Query(ctx, q, args...)
	}
	return r.pool.Query(ctx, q, args...)
}

func (r *RegistrationRepositoryPostgres) exec(ctx context.Context, tx pgx.Tx, q string, args ...any) error {
	var err error

	if tx != nil {
		_, err = tx.Exec(ctx, q, args...)
	} else {
		_, err = r.pool.Exec(ctx, q, args...)
	}

	return err
}

func (r *RegistrationRepositoryPostgres) CreateRegistration(ctx context.Context, tx pgx.Tx, data Registration) error {

	query := `INSERT INTO training_session_register (register_id, session_id, user_id) VALUES ($1, $2, $3)`
	err := r.exec(ctx, tx, query, data.ID, data.SessionID, data.UserID)
	if err != nil {
		return fmt.Errorf("CreateRegistration: Failed to INSERT: %w", err)
	}
	return nil
}

func (r *RegistrationRepositoryPostgres) CheckForFreeSpot(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) bool {
	query := `SELECT 1
		FROM trainer_sessions ts
		LEFT JOIN training_session_register r
		    ON ts.session_id = r.session_id
		    AND r.is_canceled = FALSE
		WHERE ts.session_id = $1
		  AND ts.is_canceled = FALSE
		GROUP BY ts.capacity
		HAVING COUNT(r.register_id) < ts.capacity
		LIMIT 1`
	var ok int
	err := r.execRow(ctx, tx, query, sessionID).Scan(&ok)
	if err != nil || ok == 0 {
		log.Println(err)
		return false
	}
	return true
}

func (r *RegistrationRepositoryPostgres) CancelRegistration(ctx context.Context, tx pgx.Tx, registerID uuid.UUID) error {
	query := `UPDATE training_session_register SET is_canceled=TRUE WHERE register_id=$1`
	err := r.exec(ctx, tx, query, registerID)
	if err != nil {
		return fmt.Errorf("CancelRegistration: Failed to UPDATE: %w", err)
	}
	return nil
}

func (r *RegistrationRepositoryPostgres) ListRegistrationsForSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) ([]Registration, error) {
	query := `SELECT r.register_id, r.session_id, r.user_id, r.created_at, r.updated_at,
	                 u.email, u.first_name, u.last_name, u.role, u.phone, u.credit_score, u.is_active, u.created_at, u.updated_at
	          FROM training_session_register r
	          JOIN users u ON r.user_id = u.user_id
	          WHERE r.session_id=$1 AND r.is_canceled=FALSE`
	rows, err := r.execRows(ctx, tx, query, sessionID)
	if err != nil {
		return []Registration{}, fmt.Errorf("ListRegistrationsForSession: Failed to SELECT: %w", err)
	}
	defer rows.Close()

	resp := make([]Registration, 0)
	for rows.Next() {
		var r Registration
		var u user.User
		// We need to scan user ID into u.ID as well, but it's already in r.UserID
		// Let's scan user fields
		err := rows.Scan(&r.ID, &r.SessionID, &r.UserID, &r.CreatedAt, &r.UpdatedAt,
			&u.Email, &u.FirstName, &u.LastName, &u.Role, &u.Phone, &u.CreditScore, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return []Registration{}, fmt.Errorf("ListRegistrationsForSession: Failed to SCAN: %w", err)
		}
		u.ID = r.UserID // Set ID from registration
		r.User = &u
		resp = append(resp, r)
	}
	return resp, nil
}

func (r *RegistrationRepositoryPostgres) ListRegistrationsForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID, offset int) ([]Registration, error) {
	query := `SELECT r.register_id, r.session_id, r.user_id, r.created_at, r.updated_at,
	                 ts.session_id, ts.schedule_id, ts.trainer_id, ts.facility_id, ts.date, ts.start_time, ts.end_time, ts.capacity, ts.is_canceled
	          FROM training_session_register r
	          JOIN trainer_sessions ts ON r.session_id = ts.session_id
	          WHERE r.user_id=$1 AND r.is_canceled=FALSE OFFSET $2 LIMIT 10`
	rows, err := r.execRows(ctx, tx, query, userID, offset)
	if err != nil {
		return []Registration{}, fmt.Errorf("ListRegistrationsForUser: Failed to SELECT: %w", err)
	}
	defer rows.Close()

	resp := make([]Registration, 0)
	for rows.Next() {
		var r Registration
		var s session.Session
		err := rows.Scan(&r.ID, &r.SessionID, &r.UserID, &r.CreatedAt, &r.UpdatedAt,
			&s.ID, &s.ScheduleID, &s.TrainerID, &s.FacilityID, &s.Date, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsCanceled)
		if err != nil {
			return []Registration{}, fmt.Errorf("ListRegistrationsForUser: Failed to SCAN: %w", err)
		}
		r.Session = &s
		resp = append(resp, r)
	}
	return resp, nil
}

func (r *RegistrationRepositoryPostgres) CheckIfUserRegistered(ctx context.Context, tx pgx.Tx, sessionID, userID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM training_session_register WHERE session_id=$1 AND user_id=$2 AND is_canceled=FALSE)`
	var exists bool
	err := r.execRow(ctx, tx, query, sessionID, userID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("CheckIfUserRegistered: %w", err)
	}
	return exists, nil
}
