package dto

import (
	"t/internal/penalty"
	"time"

	"github.com/google/uuid"
)

type CreatePenaltyRequest struct {
	UserID      uuid.UUID `json:"user_id"`
	GivenByID   uuid.UUID `json:"given_by_id"`
	BookingID   uuid.UUID `json:"booking_id"`
	SessionID   uuid.UUID `json:"session_id"`
	Reason      string    `json:"reason" validate:"required"`
	Points      int       `json:"points" validate:"required"`
	PenaltyType string    `json:"penalty_type" validate:"required"`
}

func (p *CreatePenaltyRequest) ToModel() penalty.Penalty {
	return penalty.Penalty{
		UserID:      p.UserID,
		GivenByID:   p.GivenByID,
		BookingID:   p.BookingID,
		SessionID:   p.SessionID,
		Reason:      p.Reason,
		Points:      p.Points,
		PenaltyType: p.PenaltyType,
	}
}

type PenaltyResponse struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	GivenByID    uuid.UUID  `json:"given_by_id"`
	SessionID    uuid.UUID  `json:"session_id"`
	BookingID    uuid.UUID  `json:"booking_id"`
	Reason       string     `json:"reason"`
	Points       int        `json:"points"`
	PenaltyType  string     `json:"penalty_type"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	FacilityName string     `json:"facility_name,omitempty"`
	SessionDate  *time.Time `json:"session_date,omitempty"`
	BookingDate  *time.Time `json:"booking_date,omitempty"`
	ContextInfo  string     `json:"context_info,omitempty"`
	UserName     string     `json:"user_name,omitempty"`
}

func (p *PenaltyResponse) FromModel(m penalty.Penalty) {
	p.ID = m.ID
	p.UserID = m.UserID
	p.GivenByID = m.UserID
	p.SessionID = m.SessionID
	p.BookingID = m.BookingID
	p.Reason = m.Reason
	p.Points = m.Points
	p.PenaltyType = m.PenaltyType
	p.CreatedAt = m.CreatedAt
	p.UpdatedAt = m.UpdatedAt
	p.FacilityName = m.FacilityName
	p.SessionDate = m.SessionDate
	p.BookingDate = m.BookingDate
	p.ContextInfo = m.ContextInfo
	p.UserName = m.UserName
}
