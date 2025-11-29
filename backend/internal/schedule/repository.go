package schedule

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ScheduleRepository interface {
	CreateTrainingScehdule(ctx context.Context, data Schedule) error
	DeleteTrainingSchedule(ctx context.Context, id uuid.UUID) error
	ListSchedulesForTrainer(ctx context.Context, trainerID uuid.UUID) ([]Schedule, error)
	ListSchedulesForFacility(ctx context.Context, facilityID uuid.UUID) ([]Schedule, error)
}

type ScheduleRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewScheduleRepositoryPostgres(p *pgxpool.Pool) *ScheduleRepositoryPostgres {
	return &ScheduleRepositoryPostgres{
		pool: p,
	}
}

func (r *ScheduleRepositoryPostgres) CreateTrainingScehdule(ctx context.Context, data Schedule) error {
	//craete transaction
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		return fmt.Errorf("CreateTrainingScehdule: Failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check for overlaps: (StartA < EndB) AND (EndA > StartB)
	query := `SELECT COUNT(*) FROM trainer_weekly_schedule 
			  WHERE trainer_id=$1 AND weekday=$2 
			  AND start_time < $3 AND end_time > $4`
	var count int
	err = tx.QueryRow(ctx, query, data.TrainerID, data.WeekDay, data.EndTime, data.StartTime).Scan(&count)
	if err != nil {
		return fmt.Errorf("CreateTrainingScehdule: Failed to query: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("Trainer cannot have overlapping trainings")
	}

	query = `INSERT INTO trainer_weekly_schedule ( schedule_id,trainer_id, facility_id, weekday, start_time, end_time, capacity) VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err = tx.Exec(ctx, query, data.ID, data.TrainerID, data.FacilityID, data.WeekDay, data.StartTime, data.EndTime, data.Capacity)
	if err != nil {
		return fmt.Errorf("CreateTrainingScehdule: Failed to Insert: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *ScheduleRepositoryPostgres) DeleteTrainingSchedule(ctx context.Context, id uuid.UUID) error {

	//delete all the sessions with it

	//delete the schedule it self
	query := `DELETE FROM trainer_weekly_schedule WHERE schedule_id=$1`

	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("DeleteTrainingSchedule: Failed to delete schedule: %w", err)
	}
	return nil
}

// func (r *ScheduleRepositoryPostgres) UpdateTrainingSecheule(ctx context.Context, data Schedule) error {
// 	query := `UPDATE trainer_weekly_schedule SET facility_id=$1, weekday=$2, start_time=$3, end_time=$4, capacity=$5, updated_at=NOW() WHERE schedule_id=$6`
// 	_, err := r.pool.Exec(ctx, query, data.FacilityID, data.WeekDay, data.StartTime, data.EndTime, data.Capacity, data.ID)
// 	if err != nil {
// 		return fmt.Errorf("UpdateTrainingSecheule: Failed to update: %w", err)
// 	}
// 	return nil
// }

func (r *ScheduleRepositoryPostgres) ListSchedulesForTrainer(ctx context.Context, trainerID uuid.UUID) ([]Schedule, error) {
	query := `SELECT schedule_id, trainer_id, facility_id, weekday, start_time, end_time, capacity, is_active, created_at, updated_at 
			  FROM trainer_weekly_schedule WHERE trainer_id=$1 ORDER BY weekday, start_time`

	rows, err := r.pool.Query(ctx, query, trainerID)
	if err != nil {
		return nil, fmt.Errorf("ListSchedulesForTrainer: Failed to query: %w", err)
	}
	defer rows.Close()

	var schedules []Schedule
	for rows.Next() {
		var s Schedule
		err := rows.Scan(&s.ID, &s.TrainerID, &s.FacilityID, &s.WeekDay, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("ListSchedulesForTrainer: Failed to scan: %w", err)
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}

func (r *ScheduleRepositoryPostgres) ListSchedulesForFacility(ctx context.Context, facilityID uuid.UUID) ([]Schedule, error) {
	query := `SELECT schedule_id, trainer_id, facility_id, weekday, start_time, end_time, capacity, is_active, created_at, updated_at 
			  FROM trainer_weekly_schedule WHERE facility_id=$1 ORDER BY weekday, start_time`

	rows, err := r.pool.Query(ctx, query, facilityID)
	if err != nil {
		return nil, fmt.Errorf("ListSchedulesForFacility: Failed to query: %w", err)
	}
	defer rows.Close()

	var schedules []Schedule
	for rows.Next() {
		var s Schedule
		err := rows.Scan(&s.ID, &s.TrainerID, &s.FacilityID, &s.WeekDay, &s.StartTime, &s.EndTime, &s.Capacity, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("ListSchedulesForFacility: Failed to scan: %w", err)
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}
