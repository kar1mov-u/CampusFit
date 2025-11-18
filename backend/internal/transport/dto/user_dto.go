package dto

import (
	"t/internal/user"
	"time"
)

type CreateUserDTO struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"first_name" validate:"required,min=2,max=50"`
	LastName  string `json:"last_name" validate:"required,min=2,max=50"`
	Password  string `json:"password" validate:"required,min=6,max=100"`
	Phone     string `json:"phone"` // if using phone validation
	Role      string `json:"role" validate:"required,oneof=student staff"`
}

func (d *CreateUserDTO) ToModel() user.User {
	return user.User{
		Email:       d.Email,
		FirstName:   d.FirstName,
		LastName:    d.LastName,
		Password:    d.Password, // hash before saving!
		Phone:       d.Phone,
		CreditScore: 100, // default maybe?
		Role:        d.Role,
		IsActive:    true,
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
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Role        string    `json:"role"`
	Phone       string    `json:"phone"`
	CreditScore int       `json:"credit_score"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (d *UserResponseDTO) FromModel(u user.User) {
	d.ID = u.ID.String()
	d.Email = u.Email
	d.FirstName = u.FirstName
	d.LastName = u.LastName
	d.Role = u.Role
	d.Phone = u.Phone
	d.CreditScore = u.CreditScore
	d.IsActive = u.IsActive
	d.CreatedAt = u.CreatedAt
	d.UpdatedAt = u.UpdatedAt
}
