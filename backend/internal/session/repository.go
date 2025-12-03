package session

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionRepository interface {
	CreateSession(ctx context.Context, data Session) error
	DeleteSession(ctx context.Context, id uuid.UUID) error
	CancelSession(ctx context.Context, id uuid.UUID) error
	ListFacilitySessions(ctx context.Context, facilityID uuid.UUID, date time.Time) ([]Session, error)
	ListTrainerSessions(ctx context.Context, trainerID uuid.UUID, date time.Time) ([]Session, error)
	GetSession(ctx context.Context, id uuid.UUID) (*Session, error)
}

type SessionRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewSessionRepositoryPostgres(p *pgxpool.Pool) *SessionRepositoryPostgres {
	return &SessionRepositoryPostgres{
		pool: p,
	}
}

func (r *SessionRepositoryPostgres) CreateSession(ctx context.Context, data Session) error {
	query := `INSERT INTO trainer_sessions (session_id, schedule_id, trainer_id, facility_id, date, start_time, end_time, capacity, is_canceled) VALUES ($1, $2,$3,$4,$5,$6,$7,$8,$9)`

	_, err := r.pool.Query(ctx, query, data.ID, data.ScheduleID, data.TrainerID, data.FacilityID, data.Date, data.StartTime, data.EndTime, data.Capacity, data.IsCanceled)
	if err != nil {
		return fmt.Errorf("CreateSession: Failed to INSERT: %w", err)
	}

	return nil
}

func (r *SessionRepositoryPostgres) DeleteSession(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM trainer_sessions WHERE session_id=$1`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("DeleteSession: Failed to INSERT: %w", err)
	}

	return nil
}

func (r *SessionRepositoryPostgres) CancelSession(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE trainer_sessions SET is_canceled=TRUE WHERE session_id=$1`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("CancelSession: Failed to Update: %w", err)
	}
	return nil
}

func (r *SessionRepositoryPostgres) ListFacilitySessions(ctx context.Context, facilityID uuid.UUID, date time.Time) ([]Session, error) {
	query := `SELECT ts.session_id, ts.schedule_id, ts.trainer_id, ts.facility_id, ts.date, ts.start_time, ts.end_time, ts.capacity, ts.is_canceled,
			  (SELECT COUNT(*) FROM training_session_register r WHERE r.session_id = ts.session_id AND r.is_canceled = FALSE) as registered_count
			  FROM trainer_sessions ts WHERE ts.facility_id=$1 AND ts.date=$2 ORDER BY ts.start_time`

	rows, err := r.pool.Query(ctx, query, facilityID, date)
	if err != nil {
		return nil, fmt.Errorf("ListFacilitySessions: Failed to query: %w", err)
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		err := rows.Scan(&s.ID, &s.ScheduleID, &s.TrainerID, &s.FacilityID, &s.Date, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsCanceled, &s.RegisteredCount)
		if err != nil {
			return nil, fmt.Errorf("ListFacilitySessions: Failed to scan: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *SessionRepositoryPostgres) ListTrainerSessions(ctx context.Context, trainerID uuid.UUID, date time.Time) ([]Session, error) {
	query := `SELECT ts.session_id, ts.schedule_id, ts.trainer_id, ts.facility_id, ts.date, ts.start_time, ts.end_time, ts.capacity, ts.is_canceled,
			  (SELECT COUNT(*) FROM training_session_register r WHERE r.session_id = ts.session_id AND r.is_canceled = FALSE) as registered_count
			  FROM trainer_sessions ts WHERE ts.trainer_id=$1 AND ts.date=$2 ORDER BY ts.start_time`

	rows, err := r.pool.Query(ctx, query, trainerID, date)
	if err != nil {
		return nil, fmt.Errorf("ListTrainerSessions: Failed to query: %w", err)
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		err := rows.Scan(&s.ID, &s.ScheduleID, &s.TrainerID, &s.FacilityID, &s.Date, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsCanceled, &s.RegisteredCount)
		if err != nil {
			return nil, fmt.Errorf("ListTrainerSessions: Failed to scan: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *SessionRepositoryPostgres) GetSession(ctx context.Context, id uuid.UUID) (*Session, error) {
	query := `SELECT ts.session_id, ts.schedule_id, ts.trainer_id, ts.facility_id, ts.date, ts.start_time, ts.end_time, ts.capacity, ts.is_canceled,
			  (SELECT COUNT(*) FROM training_session_register r WHERE r.session_id = ts.session_id AND r.is_canceled = FALSE) as registered_count
			  FROM trainer_sessions ts WHERE ts.session_id=$1`

	var s Session
	err := r.pool.QueryRow(ctx, query, id).Scan(&s.ID, &s.ScheduleID, &s.TrainerID, &s.FacilityID, &s.Date, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsCanceled, &s.RegisteredCount)
	if err != nil {
		return nil, fmt.Errorf("GetSession: Failed to scan: %w", err)
	}
	return &s, nil
}
