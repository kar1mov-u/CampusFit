package booking

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BookingRepository interface {
	UserHasBooking(ctx context.Context, tx pgx.Tx, userID uuid.UUID, facilID uuid.UUID, date time.Time) (bool, error)                  //checks user has booking in that facility in that day
	UserHasOverlap(ctx context.Context, tx pgx.Tx, userID uuid.UUID, start time.Time, end time.Time, date time.Time) (bool, error)     //checks user has overalp of bookings with other facilities
	BookingHasOverlap(ctx context.Context, tx pgx.Tx, facilID uuid.UUID, start time.Time, end time.Time, date time.Time) (bool, error) //checks if the booking on that facility has not  overalp on that time interval
	HasTooManyBookings(ctx context.Context, tx pgx.Tx, userID uuid.UUID) (bool, error)
	CreateBooking(ctx context.Context, tx pgx.Tx, data Booking) error
	ListBookigsForFacility(ctx context.Context, tx pgx.Tx, facilID uuid.UUID, date time.Time) ([]Booking, error)
	ListBookingsForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID, offset int) ([]Booking, error)

	CancelBooking(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, adminNote string) error
	ListBookings(ctx context.Context, tx pgx.Tx, start_date time.Time, end_date time.Time, offset int) ([]Booking, error)
	BeginTx(context.Context) (pgx.Tx, error)
}

type BookingRepositoryPostgres struct {
	pool *pgxpool.Pool
}

func NewBookingRepositoryPostgres(p *pgxpool.Pool) *BookingRepositoryPostgres {

	return &BookingRepositoryPostgres{
		pool: p,
	}
}

func (r *BookingRepositoryPostgres) BeginTx(ctx context.Context) (pgx.Tx, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{
		IsoLevel: pgx.Serializable,
	})
	return tx, err
}

func (r *BookingRepositoryPostgres) execRow(ctx context.Context, tx pgx.Tx, q string, args ...any) pgx.Row {
	if tx != nil {
		return tx.QueryRow(ctx, q, args...)
	}
	return r.pool.QueryRow(ctx, q, args...)
}

func (r *BookingRepositoryPostgres) execRows(ctx context.Context, tx pgx.Tx, q string, args ...any) (pgx.Rows, error) {
	if tx != nil {
		return tx.Query(ctx, q, args...)
	}
	return r.pool.Query(ctx, q, args...)
}

func (r *BookingRepositoryPostgres) exec(ctx context.Context, tx pgx.Tx, q string, args ...any) error {
	var err error

	if tx != nil {
		_, err = tx.Exec(ctx, q, args...)
	} else {
		_, err = r.pool.Exec(ctx, q, args...)
	}

	return err
}

func (r *BookingRepositoryPostgres) UserHasBooking(ctx context.Context, tx pgx.Tx, userID uuid.UUID, facilID uuid.UUID, date time.Time) (bool, error) {
	query := `SELECT COUNT(*) FROM bookings WHERE user_id=$1 and facility_id = $2 and date = $3 and is_canceled = FALSE`
	var count int

	err := r.execRow(ctx, tx, query, userID, facilID, date).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("UserHasBooking query error: %w", err)
	}

	return count > 0, nil
}

func (r *BookingRepositoryPostgres) UserHasOverlap(ctx context.Context, tx pgx.Tx, userID uuid.UUID, start time.Time, end time.Time, date time.Time) (bool, error) {
	query := `
        SELECT COUNT(*)
        FROM bookings
        WHERE user_id = $1
          AND date = $2
          AND is_canceled = FALSE
          AND NOT (end_time <= $3 OR start_time >= $4)
    `

	var count int
	err := r.execRow(ctx, tx, query, userID, date, start, end).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("UserHasOverlap query error: %w", err)
	}

	return count > 0, nil
}

func (r *BookingRepositoryPostgres) BookingHasOverlap(ctx context.Context, tx pgx.Tx, facilID uuid.UUID, start time.Time, end time.Time, date time.Time) (bool, error) {
	query := `
        SELECT COUNT(*)
        FROM bookings
        WHERE facility_id = $1
          AND date = $2
          AND is_canceled = FALSE
          AND NOT (end_time <= $3 OR start_time >= $4)
    `

	var count int
	err := r.execRow(ctx, tx, query, facilID, date, start, end).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("BookingHasOverlap query error: %w", err)
	}

	return count > 0, nil
}

func (r *BookingRepositoryPostgres) HasTooManyBookings(ctx context.Context, tx pgx.Tx, userID uuid.UUID) (bool, error) {
	// Count bookings that are in the future OR today but haven't ended yet
	query := `
		SELECT COUNT(*) 
		FROM bookings 
		WHERE user_id = $1 
		  AND is_canceled = FALSE
		  AND (
		      date > CURRENT_DATE 
		      OR (date = CURRENT_DATE AND end_time > LOCALTIME)
		  )
	`

	var count int
	err := r.execRow(ctx, tx, query, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("HasTooManyBookings query error: %w", err)
	}
	log.Println(count)
	return count >= 3, nil
}

func (r *BookingRepositoryPostgres) CreateBooking(ctx context.Context, tx pgx.Tx, data Booking) error {
	query := `
        INSERT INTO bookings (
            user_id,
            facility_id,
            date,
            start_time,
            end_time,
            note,
            is_canceled,
            admin_note,
            created_at,
            updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW());
    `

	err := r.exec(ctx, tx, query,
		data.UserID,
		data.FacilityID,
		data.Date,
		data.StartTime,
		data.EndTime,
		data.Note,
		data.IsCanceled,
		data.AdminNote,
	)

	if err != nil {
		return fmt.Errorf("CreateBooking: insert failed: %w", err)
	}

	return nil
}

func (r *BookingRepositoryPostgres) ListBookigsForFacility(ctx context.Context, tx pgx.Tx, facilID uuid.UUID, date time.Time) ([]Booking, error) {
	query := `SELECT booking_id, facility_id, user_id,date, start_time, end_time, note, created_at FROM bookings WHERE facility_id = $1 AND is_canceled = FALSE AND date = $2`

	rows, err := r.execRows(ctx, tx, query, facilID, date)
	if err != nil {
		return []Booking{}, fmt.Errorf("repository.ListBookigsFacility querying rows: %w", err)
	}

	defer rows.Close()

	resp := make([]Booking, 0)

	for rows.Next() {
		var i Booking
		err = rows.Scan(&i.ID, &i.FacilityID, &i.UserID, &i.Date, &i.StartTime, &i.EndTime, &i.Note, &i.CreatedAt)
		if err != nil {
			return []Booking{}, fmt.Errorf("repository.ListBookigsFacility scanning rows: %w", err)
		}

		resp = append(resp, i)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("repository.ListBookingsForFacility rows: %w", rows.Err())
	}
	return resp, nil
}

func (r *BookingRepositoryPostgres) ListBookingsForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID, offset int) ([]Booking, error) {

	resp := make([]Booking, 0)

	query := `
        SELECT booking_id, facility_id, user_id, date, start_time, end_time, note, is_canceled, created_at
        FROM bookings
        WHERE user_id = $1
        ORDER BY date DESC, start_time DESC
        OFFSET $2 
        LIMIT $3
    `

	rows, err := r.execRows(ctx, tx, query, userID, offset, 20)
	if err != nil {
		return nil, fmt.Errorf("ListBookingsForUser querying rows: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var b Booking
		err = rows.Scan(
			&b.ID,
			&b.FacilityID,
			&b.UserID,
			&b.Date,
			&b.StartTime,
			&b.EndTime,
			&b.Note,
			&b.IsCanceled,
			&b.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("ListBookingsForUser scanning: %w", err)
		}

		resp = append(resp, b)
	}

	return resp, nil
}

func (r *BookingRepositoryPostgres) ListBookings(ctx context.Context, tx pgx.Tx, start_date time.Time, end_date time.Time, offset int) ([]Booking, error) {
	query := `SELECT booking_id, facility_id, user_id, date, start_time, end_time, note, is_canceled, created_at
        	FROM bookings WHERE date BETWEEN $1 AND $2 ORDER BY date DESC, start_time DESC OFFSET $3 LIMIT 20`
	rows, err := r.execRows(ctx, tx, query, start_date, end_date, offset)
	if err != nil {
		return []Booking{}, fmt.Errorf("repository.ListBookings Failed to query rows: %w", err)
	}
	defer rows.Close()

	bookings := make([]Booking, 0)

	for rows.Next() {
		var b Booking
		err = rows.Scan(
			&b.ID,
			&b.FacilityID,
			&b.UserID,
			&b.Date,
			&b.StartTime,
			&b.EndTime,
			&b.Note,
			&b.IsCanceled,
			&b.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("repository.ListBookings scanning rows: %w", err)
		}

		bookings = append(bookings, b)

	}

	return bookings, nil
}

func (r *BookingRepositoryPostgres) CancelBooking(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, adminNote string) error {
	query := `UPDATE bookings SET is_canceled=TRUE, admin_note=$1 WHERE booking_id=$2 `
	return r.exec(ctx, tx, query, adminNote, bookingID)
}
