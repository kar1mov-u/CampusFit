package service

import (
	"t/internal/models"
	"t/internal/repository"
)

type UserService struct {
	userRepo repository.UserRepostiory
}

func NewUserService(usrRep repository.UserRepostiory) *UserService {
	return &UserService{userRepo: usrRep}
}

func (s *UserService) CraeteUser(models.User) (string, error) {
	//all the checks will be maid in the transport layet, it will turn json to the DTO, and will run validation, then convert to the domain model and call service func
	return "", nil
}
