package registration

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type RegistrationService struct {
	registerRepo RegistrationRepository
}

func NewRegistrationService(registerRepo RegistrationRepository) *RegistrationService {
	return &RegistrationService{registerRepo: registerRepo}
}

func (s *RegistrationService) CreateRegistration(ctx context.Context, data Registration) error {
	//create transaction
	tx, err := s.registerRepo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("CreateRegistration: Failed to Create Transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	//check if there are free slots
	ok := s.registerRepo.CheckForFreeSpot(ctx, tx, data.SessionID)
	if !ok {
		return fmt.Errorf("There is not free spots")
	}
	//create the registration
	err = s.registerRepo.CreateRegistration(ctx, tx, data)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *RegistrationService) CancelRegistration(ctx context.Context, id uuid.UUID) error {
	tx, err := s.registerRepo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("CancelRegistration: Failed to Create Transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	err = s.registerRepo.CancelRegistration(ctx, tx, id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *RegistrationService) ListRegistrationsForSession(ctx context.Context, sessionID uuid.UUID) ([]Registration, error) {
	// Read-only operation, no transaction needed unless we want repeatable read
	// For simplicity, passing nil as tx which repository handles
	return s.registerRepo.ListRegistrationsForSession(ctx, nil, sessionID)
}

func (s *RegistrationService) ListRegistrationsForUser(ctx context.Context, userID uuid.UUID, offset int) ([]Registration, error) {
	return s.registerRepo.ListRegistrationsForUser(ctx, nil, userID, offset)
}
