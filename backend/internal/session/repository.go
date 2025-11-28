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
}

type SessionRepositoryPostgres struct {
	pool *pgxpool.Pool
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
	query := `SELECT session_id, schedule_id, trainer_id, facility_id, date, start_time, end_time, capacity, is_canceled 
			  FROM trainer_sessions WHERE facility_id=$1 AND date=$2 ORDER BY start_time`

	rows, err := r.pool.Query(ctx, query, facilityID, date)
	if err != nil {
		return nil, fmt.Errorf("ListFacilitySessions: Failed to query: %w", err)
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		err := rows.Scan(&s.ID, &s.ScheduleID, &s.TrainerID, &s.FacilityID, &s.Date, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsCanceled)
		if err != nil {
			return nil, fmt.Errorf("ListFacilitySessions: Failed to scan: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *SessionRepositoryPostgres) ListTrainerSessions(ctx context.Context, trainerID uuid.UUID, date time.Time) ([]Session, error) {
	query := `SELECT session_id, schedule_id, trainer_id, facility_id, date, start_time, end_time, capacity, is_canceled 
			  FROM trainer_sessions WHERE trainer_id=$1 AND date=$2 ORDER BY start_time`

	rows, err := r.pool.Query(ctx, query, trainerID, date)
	if err != nil {
		return nil, fmt.Errorf("ListTrainerSessions: Failed to query: %w", err)
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		err := rows.Scan(&s.ID, &s.ScheduleID, &s.TrainerID, &s.FacilityID, &s.Date, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsCanceled)
		if err != nil {
			return nil, fmt.Errorf("ListTrainerSessions: Failed to scan: %w", err)
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
