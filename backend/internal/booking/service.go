package booking

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type BookingService struct {
	bookingRepo BookingRepository
}

func NewBookingService(bookingRep BookingRepository) *BookingService {
	return &BookingService{
		bookingRepo: bookingRep,
	}
}

func (s *BookingService) CreateNewBooking(ctx context.Context, data Booking) error {
	// 1. Begin transaction
	tx, err := s.bookingRepo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	hasBooking, err := s.bookingRepo.UserHasBooking(ctx, tx, data.UserID, data.FacilityID, data.Date)
	if err != nil {
		return fmt.Errorf("failed to check user daily booking: %w", err)
	}
	if hasBooking {
		return fmt.Errorf("user already booked this facility on this day")
	}

	hasUserOverlap, err := s.bookingRepo.UserHasOverlap(ctx, tx, data.UserID, data.StartTime, data.EndTime, data.Date)
	if err != nil {
		return fmt.Errorf("failed to check user overlap: %w", err)
	}
	if hasUserOverlap {
		return fmt.Errorf("user has another booking during this time")
	}

	hasFacilityOverlap, err := s.bookingRepo.BookingHasOverlap(ctx, tx, data.FacilityID, data.StartTime, data.EndTime, data.Date)
	if err != nil {
		return fmt.Errorf("failed to check facility overlap: %w", err)
	}
	if hasFacilityOverlap {
		return fmt.Errorf("facility is already booked for this interval")
	}

	hasTooManyBookings, err := s.bookingRepo.HasTooManyBookings(ctx, tx, data.UserID)
	if err != nil {
		return fmt.Errorf("failed to check too many bookings: %w", err)
	}
	if hasTooManyBookings {
		return fmt.Errorf("user has 3 upcoming bookings. Cannot book another one")
	}

	if err := s.bookingRepo.CreateBooking(ctx, tx, data); err != nil {
		return fmt.Errorf("failed to create booking: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit booking transaction: %w", err)
	}

	return nil
}

func (s *BookingService) ListBookingsForFacility(ctx context.Context, facilID uuid.UUID, date time.Time) ([]Booking, error) {
	return s.bookingRepo.ListBookigsForFacility(ctx, nil, facilID, date)
}

func (s *BookingService) ListBookingForUser(ctx context.Context, userID uuid.UUID, offset int) ([]Booking, error) {
	return s.bookingRepo.ListBookingsForUser(ctx, nil, userID, offset)
}

func (s *BookingService) ListBookings(ctx context.Context, start_date time.Time, end_date time.Time, offset int) ([]Booking, error) {
	return s.bookingRepo.ListBookings(ctx, nil, start_date, end_date, offset)
}

func (s *BookingService) CancelBooking(ctx context.Context, bookingID uuid.UUID, admin_note string) error {
	return s.bookingRepo.CancelBooking(ctx, nil, bookingID, admin_note)
}
