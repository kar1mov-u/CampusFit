package dto

import (
	"fmt"
	"t/internal/facility"
	"time"

	"github.com/google/uuid"
)

type CreateFacilityDTO struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Type        string `json:"type" validate:"required"`
	Description string `json:"description" validate:"required,min=5"`
	Capacity    int    `json:"capacity" validate:"required,min=1"`
	OpenTime    string `json:"open_time" validate:"required,datetime=15:04"`
	CloseTime   string `json:"close_time" validate:"required,datetime=15:04"`
	ImageURL    string `json:"image_url" validate:"url"`
}

type FacilityResponseDTO struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Capacity    int       `json:"capacity"`
	OpenTime    string    `json:"open_time"`
	CloseTime   string    `json:"close_time"`
	ImageURL    string    `json:"image_url"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (d *CreateFacilityDTO) ToModel() (facility.Facility, error) {
	openTime, err := time.Parse("15:04", d.OpenTime)
	if err != nil {
		return facility.Facility{}, fmt.Errorf("invalid open_time format, expected HH:MM")
	}

	closeTime, err := time.Parse("15:04", d.CloseTime)
	if err != nil {
		return facility.Facility{}, fmt.Errorf("invalid close_time format, expected HH:MM")
	}

	now := time.Now()

	return facility.Facility{
		ID:          uuid.New(),
		Name:        d.Name,
		Type:        d.Type,
		Description: d.Description,
		Capacity:    d.Capacity,
		OpenTime:    openTime,
		CloseTime:   closeTime,
		ImageURL:    d.ImageURL,
		IsActive:    true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (d *FacilityResponseDTO) ToDTO(f facility.Facility) {
	d.ID = f.ID.String()
	d.Name = f.Name
	d.Type = f.Type
	d.Description = f.Description
	d.Capacity = f.Capacity
	d.OpenTime = f.OpenTime.Format("15:04")
	d.CloseTime = f.CloseTime.Format("15:04")
	d.ImageURL = f.ImageURL
	d.IsActive = f.IsActive
	d.CreatedAt = f.CreatedAt
	d.UpdatedAt = f.UpdatedAt
}

type UpdateFacilityDTO struct {
	Name        *string `json:"name,omitempty"`
	Type        *string `json:"type,omitempty"`
	Description *string `json:"description,omitempty"`
	Capacity    *int    `json:"capacity,omitempty"`
	OpenTime    *string `json:"open_time,omitempty"`
	CloseTime   *string `json:"close_time,omitempty"`
	ImageURL    *string `json:"image_url,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

func (d *UpdateFacilityDTO) ApplyToFacility(f *facility.Facility) error {
	if d.Name != nil {
		f.Name = *d.Name
	}
	if d.Type != nil {
		f.Type = *d.Type
	}
	if d.Description != nil {
		f.Description = *d.Description
	}
	if d.Capacity != nil {
		f.Capacity = *d.Capacity
	}
	if d.OpenTime != nil {
		t, err := time.Parse("15:04", *d.OpenTime)
		if err != nil {
			return err
		}
		f.OpenTime = t
	}
	if d.CloseTime != nil {
		t, err := time.Parse("15:04", *d.CloseTime)
		if err != nil {
			return err
		}
		f.CloseTime = t
	}
	if d.ImageURL != nil {
		f.ImageURL = *d.ImageURL
	}
	if d.IsActive != nil {
		f.IsActive = *d.IsActive
	}

	f.UpdatedAt = time.Now()
	return nil
}
