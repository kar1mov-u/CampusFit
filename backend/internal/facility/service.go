package facility

import (
	"context"

	"github.com/google/uuid"
)

type FacilityService struct {
	facilityRepo FacilityRepository
}

func NewFacilityService(r FacilityRepository) *FacilityService {
	return &FacilityService{
		facilityRepo: r,
	}
}

func (s *FacilityService) CreateFacility(ctx context.Context, f Facility) error {
	err := s.facilityRepo.CreateFacility(ctx, f)
	return err
}

func (s *FacilityService) GetFacility(ctx context.Context, id uuid.UUID) (Facility, error) {
	return s.facilityRepo.GetFacility(ctx, id)
}

func (s *FacilityService) ListFacilities(ctx context.Context) ([]Facility, error) {
	return s.facilityRepo.ListFacilities(ctx)
}

func (s *FacilityService) UpdateFacility(ctx context.Context, f Facility) error {
	_, err := s.facilityRepo.GetFacility(ctx, f.ID)
	if err != nil {

		return err // facility does not exist
	}
	return s.facilityRepo.UpdateFacility(ctx, f)
}

func (s *FacilityService) DeleteFacility(ctx context.Context, id uuid.UUID) error {
	return s.facilityRepo.DeleteFacility(ctx, id)
}
