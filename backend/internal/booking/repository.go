package booking

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BookingRepository interface {
	UserHasBooking(ctx context.Context, userID uuid.UUID, facilID uuid.UUID, date time.Time) bool                  //checks user has booking in that facility in that day
	UserHasOverlap(ctx context.Context, userID uuid.UUID, start time.Time, end time.Time, date time.Time) bool     //checks user has overalp of bookings with other facilities
	BookingHasOverlap(ctx context.Context, facilID uuid.UUID, start time.Time, end time.Time, date time.Time) bool //checks if the booking on that facility has not  overalp on that time interval
	CreateBooking(ctx context.Context, data Booking)
}

type BookingRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewBookingRepositoryPostgres(p *pgxpool.Pool) *BookingRepositoryPostgres {
	return &BookingRepositoryPostgres{
		pool: p,
	}
}
