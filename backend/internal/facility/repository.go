package facility

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FacilityRepository interface {
	GetFacility(context.Context, uuid.UUID) (Facility, error)
	ListFacilities(context.Context) ([]Facility, error)
	CreateFacility(context.Context, Facility) error
	UpdateFacility(context.Context, Facility) error
	DeleteFacility(context.Context, uuid.UUID) error
}

type FacilityRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewFacilityRepositoryPostgres(pool *pgxpool.Pool) *FacilityRepositoryPostgres {
	return &FacilityRepositoryPostgres{
		pool: pool,
	}
}

func (r *FacilityRepositoryPostgres) GetFacility(ctx context.Context, id uuid.UUID) (Facility, error) {
	var f Facility

	query := `
		SELECT
			facility_id,
			name,
			type,
			description,
			capacity,
			open_time,
			close_time,
			image_url,
			is_active,
			created_at,
			updated_at
		FROM facilities
		WHERE facility_id = $1
	`

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&f.ID,
		&f.Name,
		&f.Type,
		&f.Description,
		&f.Capacity,
		&f.OpenTime,
		&f.CloseTime,
		&f.ImageURL,
		&f.IsActive,
		&f.CreatedAt,
		&f.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Facility{}, fmt.Errorf("facility not found: %w", err)
		}
		return Facility{}, fmt.Errorf("repository.GetFacility: %w", err)
	}

	return f, nil
}

func (r *FacilityRepositoryPostgres) ListFacilities(ctx context.Context) ([]Facility, error) {
	query := `
		SELECT
			facility_id,
			name,
			type,
			description,
			capacity,
			open_time,
			close_time,
			image_url,
			is_active,
			created_at,
			updated_at
		FROM facilities
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("repository.ListFacilities: %w", err)
	}
	defer rows.Close()

	var facilities []Facility

	for rows.Next() {
		var f Facility
		err := rows.Scan(
			&f.ID,
			&f.Name,
			&f.Type,
			&f.Description,
			&f.Capacity,
			&f.OpenTime,
			&f.CloseTime,
			&f.ImageURL,
			&f.IsActive,
			&f.CreatedAt,
			&f.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("repository.ListFacilities scan: %w", err)
		}

		facilities = append(facilities, f)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("repository.ListFacilities rows: %w", rows.Err())
	}

	return facilities, nil
}

func (r *FacilityRepositoryPostgres) CreateFacility(ctx context.Context, facility Facility) error {
	query := `INSERT INTO facilities (name, type, description, capacity, open_time, close_time, image_url, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.pool.Exec(ctx, query,
		facility.Name,
		facility.Type,
		facility.Description,
		facility.Capacity,
		facility.OpenTime,
		facility.CloseTime,
		facility.ImageURL,
		facility.IsActive,
	)

	return err
}

func (r *FacilityRepositoryPostgres) UpdateFacility(ctx context.Context, facility Facility) error {
	query := `UPDATE facilities 
              SET name = $2, type = $3, description = $4, capacity = $5, 
                  open_time = $6, close_time = $7, image_url = $8, is_active = $9,
                  updated_at = NOW()
              WHERE facility_id = $1`

	_, err := r.pool.Exec(ctx, query,
		facility.ID,
		facility.Name,
		facility.Type,
		facility.Description,
		facility.Capacity,
		facility.OpenTime,
		facility.CloseTime,
		facility.ImageURL,
		facility.IsActive,
	)

	return err
}

func (r *FacilityRepositoryPostgres) DeleteFacility(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM facilities WHERE facility_id = $1`

	_, err := r.pool.Exec(ctx, query, id)

	return err
}
