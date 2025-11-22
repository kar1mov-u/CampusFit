package booking

import (
	"context"
	"fmt"
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

	if err := s.bookingRepo.CreateBooking(ctx, tx, data); err != nil {
		return fmt.Errorf("failed to create booking: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit booking transaction: %w", err)
	}

	return nil
}
