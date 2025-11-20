package dto

import (
	"t/internal/booking"
	"time"
)

type CreateBookingRequest struct {
	FacilityID string `json:"facility_id" validate:"required,uuid4"`
	Date       string `json:"date" validate:"required"`       // "2025-02-14"
	StartTime  string `json:"start_time" validate:"required"` // "10:00"
	EndTime    string `json:"end_time" validate:"required"`   // "11:00"
	Note       string `json:"note"`
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
