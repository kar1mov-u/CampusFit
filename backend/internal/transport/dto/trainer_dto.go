package dto

import "t/internal/trainer"

type TrainerUpdateDTO struct {
	Bio       string `json:"bio" validate:"required"`
	Specialty string `json:"specialty" validate:"required"`
}

type TrainerResponseDTO struct {
	ID                string  `json:"id"`
	Bio               string  `json:"bio"`
	Specialty         string  `json:"specialty"`
	User              UserDTO `json:"user"`
	ProfilePictureURL string  `json:"profile_picture_url"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

type UserDTO struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

func (d *TrainerUpdateDTO) ToModel() trainer.Trainer {
	return trainer.Trainer{
		Bio:       d.Bio,
		Specialty: d.Specialty,
	}
}

func ToTrainerResponseDTO(t trainer.Trainer) TrainerResponseDTO {
	return TrainerResponseDTO{
		ID:        t.ID.String(),
		Bio:       t.Bio,
		Specialty: t.Specialty,
		User: UserDTO{
			ID:        t.User.ID.String(),
			FirstName: t.User.FirstName,
			LastName:  t.User.LastName,
			Email:     t.User.Email,
		},
		ProfilePictureURL: "", // Placeholder or fetch from user profile if available
		CreatedAt:         t.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:         t.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
