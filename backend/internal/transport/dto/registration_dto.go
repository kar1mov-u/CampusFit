package dto

import (
	"t/internal/registration"
	"time"

	"github.com/google/uuid"
)

type CreateRegistrationRequest struct {
	SessionID uuid.UUID `json:"session_id" validate:"required"`
}

func (r *CreateRegistrationRequest) ToDomain(userID uuid.UUID) registration.Registration {
	return registration.Registration{
		SessionID: r.SessionID,
		UserID:    userID,
	}
}

type RegistrationResponse struct {
	ID         uuid.UUID        `json:"id"`
	SessionID  uuid.UUID        `json:"session_id"`
	UserID     uuid.UUID        `json:"user_id"`
	IsCanceled bool             `json:"is_canceled"`
	CreatedAt  string           `json:"created_at"`
	UpdatedAt  string           `json:"updated_at"`
	User       *UserResponseDTO `json:"user,omitempty"`
	Session    *SessionResponse `json:"session,omitempty"`
}

func NewRegistrationResponse(r registration.Registration) RegistrationResponse {
	resp := RegistrationResponse{
		ID:         r.ID,
		SessionID:  r.SessionID,
		UserID:     r.UserID,
		IsCanceled: r.IsCanceled,
		CreatedAt:  r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  r.UpdatedAt.Format(time.RFC3339),
	}

	if r.User != nil {
		userDTO := &UserResponseDTO{}
		userDTO.FromModel(*r.User)
		resp.User = userDTO
	}

	if r.Session != nil {
		sessionDTO := NewSessionResponse(*r.Session)
		resp.Session = &sessionDTO
	}

	return resp
}
