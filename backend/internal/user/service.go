package user

import (
	"context"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	userRepo UserRepostiory
}

func NewUserService(usrRep UserRepostiory) *UserService {
	return &UserService{userRepo: usrRep}
}

func (s *UserService) CraeteUser(ctx context.Context, user User) (uuid.UUID, error) {

	//no need to check if user already exists, if theres error will be handled by DB
	id, err := s.userRepo.CreateUser(ctx, user)
	if err != nil {
		return uuid.UUID{}, err
	}
	return id, nil
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (User, error) {

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return User{}, err
	}
	return user, nil
}

// mb create the jwt here
func (s *UserService) LoginUser(ctx context.Context, email, password string) (bool, User, error) {

	//get the user from the repo
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return false, User{}, err
	}

	//check for the password
	if CheckPasswordHash(password, user.Password) {
		return true, user, nil
	}
	return false, User{}, nil
}

// CheckPasswordHash compares a plaintext password with a bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
