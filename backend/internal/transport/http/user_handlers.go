package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"t/internal/transport/dto"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (s *Server) CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	s.logger.Info("CreateUser request received",
		zap.String("route", r.URL.Path),
		zap.String("method", r.Method),
	)

	// 1. Decode DTO
	var createDto dto.CreateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&createDto); err != nil {
		s.logger.Warn("failed to decode user input",
			zap.Error(err),
		)
		respondWithJSON(w, http.StatusBadRequest, nil, "failed to decode userInput")
		return
	}

	// 2. Validate DTO
	if err := s.validator.Struct(createDto); err != nil {
		s.logger.Warn("invalid user input",
			zap.Error(err),
			zap.Any("payload", createDto),
		)
		respondWithJSON(w, http.StatusBadRequest, nil, "malformed input")
		return
	}

	// 3. Hash password
	hashedPass, err := HashPassword(createDto.Password)
	if err != nil {
		s.logger.Error("failed to hash password",
			zap.Error(err),
		)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to hash password")
		return
	}
	createDto.Password = hashedPass

	// 4. Convert to domain model
	userModel := createDto.ToModel()

	// 5. Create user via service
	id, err := s.userService.CraeteUser(r.Context(), userModel)
	if err != nil {
		s.logger.Error("failed to create user",
			zap.Error(err),
			zap.Any("userModel", userModel),
		)
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to create user")
		return
	}

	s.logger.Info("user created successfully",
		zap.String("user_id", id.String()),
	)

	respondWithJSON(w, http.StatusOK, map[string]uuid.UUID{"user_id": id}, "user created successfully")
}

func (s *Server) WhoAmI(w http.ResponseWriter, r *http.Request) {
	s.logger.Info("WhoAmI request received")

	id, err := GetID(r.Context())
	if err != nil {
		s.logger.Warn("failed to get user id from context", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid userID")
		return
	}

	user, err := s.userService.GetByID(r.Context(), id)
	if err != nil {
		s.logger.Warn("user not found",
			zap.String("user_id", id.String()),
			zap.Error(err),
		)
		respondWithJSON(w, http.StatusNotFound, nil, "user not found")
		return
	}

	var userDto dto.UserResponseDTO
	userDto.FromModel(user)

	s.logger.Info("user found", zap.String("user_id", id.String()))

	respondWithJSON(w, http.StatusOK, userDto, "user found")
}

func (s *Server) GetUserHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		s.logger.Warn("missing user id")
		http.Error(w, "missing user id", http.StatusBadRequest)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		s.logger.Warn("invalid user id",
			zap.String("id", idStr),
			zap.Error(err),
		)
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	user, err := s.userService.GetByID(r.Context(), id)
	if err != nil {
		s.logger.Warn("user not found",
			zap.String("user_id", id.String()),
			zap.Error(err),
		)
		respondWithJSON(w, http.StatusNotFound, nil, "user not found")
		return
	}

	var userResponse dto.UserResponseDTO
	userResponse.FromModel(user)

	s.logger.Info("user fetched",
		zap.String("user_id", id.String()),
	)

	respondWithJSON(w, http.StatusOK, userResponse, "user found")
}

func (s *Server) ListUsersHandler(w http.ResponseWriter, r *http.Request) {
	//check is the user is admin
	userID, err := GetID(r.Context())
	if err != nil {
		s.logger.Warn("invalid userID from context", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid userID in context")
		return
	}

	// if id's do not mathc then user should be the admin!!!
	if !s.authService.IsAdmin(r.Context(), userID) {
		s.logger.Warn("user is not admin")
		respondWithJSON(w, http.StatusForbidden, nil, "access denied")
		return
	}

	//get the offset from the query parameter and convert to int
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		s.logger.Warn("offset is not int value", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "offset should be interger")
		return
	}

	//get the keyword for search if provided
	keyword := r.URL.Query().Get("keyword")

	users, err := s.userService.ListUsers(r.Context(), keyword, offset)
	if err != nil {
		s.logger.Warn("failed to list users", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to list users")
		return
	}

	usersDto := make([]dto.UserResponseDTO, 0, len(users))
	for _, user := range users {
		var userDto dto.UserResponseDTO
		userDto.FromModel(user)
		usersDto = append(usersDto, userDto)
	}
	respondWithJSON(w, http.StatusOK, usersDto, "successfully listed users")

}
