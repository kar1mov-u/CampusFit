package dto

import (
	"t/internal/models"
	"time"
)

type CreateUserDTO struct {
	Email        string `json:"email" validate:"required,email"`
	FirstName    string `json:"first_name" validate:"required,min=2,max=50"`
	LastName     string `json:"last_name" validate:"required,min=2,max=50"`
	Password     string `json:"password" validate:"required,min=6,max=100"`
	UniversityID string `json:"university_id" validate:"required"`
	Phone        string `json:"phone"` // if using phone validation
	Role         string `json:"role" validate:"required,oneof=student staff admin"`
}

func (d *CreateUserDTO) ToModel() models.User {
	return models.User{
		Email:        d.Email,
		FirstName:    d.FirstName,
		LastName:     d.LastName,
		Password:     d.Password, // hash before saving!
		UniversityID: d.UniversityID,
		Phone:        d.Phone,
		CreditScore:  100, // default maybe?
		Role:         d.Role,
		IsActive:     true,
		// CreatedAt:    time.Now(),
		// UpdatedAt:    time.Now(),
	}
}

type UpdateUserDTO struct {
	FirstName string `json:"first_name,omitempty" validate:"omitempty,min=2,max=50"`
	LastName  string `json:"last_name,omitempty" validate:"omitempty,min=2,max=50"`
	Phone     string `json:"phone,omitempty" validate:"omitempty,e164"`
}

type UserResponseDTO struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Role         string    `json:"role"`
	UniversityID string    `json:"university_id"`
	Phone        string    `json:"phone"`
	CreditScore  int       `json:"credit_score"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
