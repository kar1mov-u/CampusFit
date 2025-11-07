package dtomodels

import "github.com/google/uuid"

type UserDTO struct {
	UserID uuid.UUID `json:"user_id"`
}
