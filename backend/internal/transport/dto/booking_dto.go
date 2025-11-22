package dto

import (
	"fmt"
	"t/internal/booking"
	"time"

	"github.com/google/uuid"
)

type CreateBookingRequest struct {
	FacilityID string `json:"facility_id" validate:"required,uuid4"`
	Date       string `json:"date" validate:"required"`       // "2025-02-14"
	StartTime  string `json:"start_time" validate:"required"` // "10:00"
	EndTime    string `json:"end_time" validate:"required"`   // "11:00"
	Note       string `json:"note"`
}

func (b *CreateBookingRequest) ToModel(userID uuid.UUID) (booking.Booking, error) {
	// Parse FacilityID
	facilID, err := uuid.Parse(b.FacilityID)
	if err != nil {
		return booking.Booking{}, fmt.Errorf("invalid facility_id: %w", err)
	}

	// Parse Date ("2025-02-14")
	date, err := time.Parse("2006-01-02", b.Date)
	if err != nil {
		return booking.Booking{}, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
	}

	// Parse StartTime ("10:00")
	start, err := time.Parse("15:04", b.StartTime)
	if err != nil {
		return booking.Booking{}, fmt.Errorf("invalid start_time format, expected HH:MM: %w", err)
	}

	// Parse EndTime ("11:00")
	end, err := time.Parse("15:04", b.EndTime)
	if err != nil {
		return booking.Booking{}, fmt.Errorf("invalid end_time format, expected HH:MM: %w", err)
	}

	// Validate interval
	if !end.After(start) {
		return booking.Booking{}, fmt.Errorf("end_time must be after start_time")
	}

	// Return domain model
	return booking.Booking{
		FacilityID: facilID,
		UserID:     userID,
		Date:       date,
		StartTime:  start,
		EndTime:    end,
		Note:       b.Note,
		IsCanceled: false,
		AdminNote:  "",
	}, nil
}

type CancelBookingRequest struct {
	AdminNote string `json:"admin_note"` // optional
}

type BookingResponse struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	FacilityID string `json:"facility_id"`
	Date       string `json:"date"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	Note       string `json:"note"`
	IsCanceled bool   `json:"is_canceled"`
	AdminNote  string `json:"admin_note"`
	CreatedAt  string `json:"created_at"`
}

func ToBookingResponse(b booking.Booking) BookingResponse {
	return BookingResponse{
		ID:         b.ID.String(),
		UserID:     b.UserID.String(),
		FacilityID: b.FacilityID.String(),
		Date:       b.Date.Format("2006-01-02"),
		StartTime:  b.StartTime.Format("15:04"),
		EndTime:    b.EndTime.Format("15:04"),
		Note:       b.Note,
		IsCanceled: b.IsCanceled,
		AdminNote:  b.AdminNote,
		CreatedAt:  b.CreatedAt.Format(time.RFC3339),
	}
}
