package trainer

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TrainerRepository interface {
	CreateTrainer(ctx context.Context, userID uuid.UUID) error
	DeleteTrainer(ctx context.Context, id uuid.UUID) error
	UpdateTrainer(ctx context.Context, trainer Trainer) error
	GetTrainer(ctx context.Context, id uuid.UUID) (Trainer, error)
	ListTrainers(ctx context.Context, offset int) ([]Trainer, error)
}

type TrainerRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewTrainerRepositoryPostgres(pool *pgxpool.Pool) *TrainerRepositoryPostgres {
	return &TrainerRepositoryPostgres{pool: pool}
}

// this will be called by admin just to promote, then trainer can set up its own settings
func (r *TrainerRepositoryPostgres) CreateTrainer(ctx context.Context, userID uuid.UUID) error {
	//with transaction first change users role in the users table to trainer
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("CreateTrainer: failed to Begin: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `UPDATE users SET role='trainer' WHERE user_id=$1`
	_, err = tx.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("CreateTrainer: failed to Exec: %w", err)
	}

	query = `INSERT INTO trainers (trainer_id) VALUES($1)`

	_, err = tx.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("CraeteTrainer: failed to Exec: %w", err)
	}

	return tx.Commit(ctx)

}

func (r *TrainerRepositoryPostgres) UpdateTrainer(ctx context.Context, trainer Trainer) error {
	query := `UPDATE trainers SET bio=$1, specialty=$2 WHERE trainer_id=$3`
	tag, err := r.pool.Exec(ctx, query, trainer.Bio, trainer.Specialty, trainer.ID)
	if err != nil {
		return fmt.Errorf("UpdateTrainer: failed to Exec: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("Trainer Not Found")
	}
	return nil
}

func (r *TrainerRepositoryPostgres) DeleteTrainer(ctx context.Context, id uuid.UUID) error {
	//with transaction first change users role in the users table to trainer
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("DeleteTrainer: failed to Begin: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `DELETE FROM trainers WHERE trainer_id=$1`
	_, err = tx.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("DeleteTrainer: failed to Exec: %w", err)
	}

	query = `UPDATE users SET role='user' WHERE user_id=$1`
	_, err = tx.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("DeleteTrainer: failed to Exec: %w", err)
	}
	return tx.Commit(ctx)
}

func (r *TrainerRepositoryPostgres) GetTrainer(ctx context.Context, id uuid.UUID) (Trainer, error) {
	query := `SELECT trainer_id, bio, specialty, created_at, updated_at FROM trainers WHERE trainer_id=$1`

	var t Trainer
	err := r.pool.QueryRow(ctx, query, id).Scan(&t.ID, &t.Bio, &t.Specialty, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return Trainer{}, fmt.Errorf("GetTrainer: Failed to Qeury: %w", err)
	}
	return t, nil
}

func (r *TrainerRepositoryPostgres) ListTrainers(ctx context.Context, offset int) ([]Trainer, error) {
	query := `SELECT trainer_id, bio, specialty, created_at, updated_at FROM trainers ORDER BY created_at DESC OFFSET $1 LIMIT 10`

	rows, err := r.pool.Query(ctx, query, offset)
	if err != nil {
		return []Trainer{}, fmt.Errorf("ListTrainers: Failed to Query: %w", err)
	}
	defer rows.Close()

	resp := make([]Trainer, 0)
	for rows.Next() {
		var t Trainer

		err := rows.Scan(&t.ID, &t.Bio, &t.Specialty, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return []Trainer{}, fmt.Errorf("ListTrainers: Failed to Scan: %w", err)
		}

		resp = append(resp, t)
	}
	return resp, nil
}
