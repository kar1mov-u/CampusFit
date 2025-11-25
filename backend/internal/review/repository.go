package review

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReviewRepository interface {
	CreateFacilityReview(ctx context.Context, facilRew FacilityReview) error
	DeleteFacilityReview(ctx context.Context, id uuid.UUID) error
	GetFacilityRating(ctx context.Context, id uuid.UUID) (float64, error)
	GetFacilityReviews(ctx context.Context, id uuid.UUID, offset int) ([]FacilityReview, error)
}

type ReviewRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewReviewRepositoryPostgres(pool *pgxpool.Pool) *ReviewRepositoryPostgres {
	return &ReviewRepositoryPostgres{
		pool: pool,
	}
}

func (r *ReviewRepositoryPostgres) CreateFacilityReview(ctx context.Context, facilRew FacilityReview) error {
	query := `INSERT INTO facility_review (facility_id, user_id, comment, rating, updated_at, created_at) VALUES( $1, $2, $3, $4, NOW(), NOW())`

	_, err := r.pool.Exec(ctx, query, facilRew.FacilityID, facilRew.UserID, facilRew.Comment, facilRew.Rating)
	if err != nil {
		return fmt.Errorf("repository.CreateFacilityReview : %w", err)
	}
	return nil
}

func (r *ReviewRepositoryPostgres) DeleteFacilityReview(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM facility_review WHERE review_id=$1`

	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("repository.DeleteFacilityReview : %w", err)
	}
	return nil
}

func (r *ReviewRepositoryPostgres) GetFacilityRating(ctx context.Context, id uuid.UUID) (float64, error) {
	query := `SELECT AVG(rating) FROM facility_review GROUP BY facility_id HAVING facility_id=$1`
	var rating float64
	err := r.pool.QueryRow(ctx, query, id).Scan(&rating)
	if err != nil {
		return 0, fmt.Errorf("repository.GetFacilityRating : %w", err)
	}
	return rating, nil
}

func (r *ReviewRepositoryPostgres) GetFacilityReviews(ctx context.Context, id uuid.UUID, offset int) ([]FacilityReview, error) {
	query := `SELECT review_id, facility_id, user_id, comment, rating, updated_at FROM facility_review WHERE facility_id=$1 OFFSET $2 LIMIT 10`

	rows, err := r.pool.Query(ctx, query, id, offset)
	if err != nil {
		return []FacilityReview{}, fmt.Errorf("repository.GetFacilityReview querying rows: %w", err)
	}

	resp := make([]FacilityReview, 0)
	for rows.Next() {
		var i FacilityReview
		err := rows.Scan(&i.ID, &i.FacilityID, &i.UserID, &i.Comment, &i.Rating, &i.CreatedAt)
		if err != nil {
			return []FacilityReview{}, fmt.Errorf("repository.GetFacilityReview Scanning rows: %w", err)
		}

		resp = append(resp, i)
	}
	return resp, nil
}
