package service

import (
	"context"
	"t/internal/models"
	"t/internal/repository"

	"github.com/google/uuid"
)

type UserService struct {
	userRepo repository.UserRepostiory
}

func NewUserService(usrRep repository.UserRepostiory) *UserService {
	return &UserService{userRepo: usrRep}
}

func (s *UserService) CraeteUser(ctx context.Context, user models.User) (uuid.UUID, error) {

	//no need to check if user already exists, if theres error will be handled by DB
	id, err := s.userRepo.CreateUser(ctx, user)
	if err != nil {
		return uuid.UUID{}, err
	}
	return id, nil
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (models.User, error) {

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
}
