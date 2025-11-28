package dto

import "t/internal/trainer"

type TrainerUpdateDTO struct {
	Bio       string `json:"bio" validate:"required"`
	Specialty string `json:"specialty" validate:"required"`
}

type TrainerResponseDTO struct {
	ID        string `json:"id"`
	Bio       string `json:"bio"`
	Specialty string `json:"specialty"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
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
		CreatedAt: t.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: t.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
