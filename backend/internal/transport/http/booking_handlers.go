package http

import (
	"encoding/json"
	"net/http"
	"t/internal/transport/dto"

	// "github.com/pingcap/log"
	// "github.com/pingcap/log"s
	"go.uber.org/zap"
)

func (s *Server) CreateBookingHandler(w http.ResponseWriter, r *http.Request) {
	//first get the input
	var createDto dto.CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&createDto); err != nil {
		s.logger.Warn("failed to decode user input", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "failed to decode user input")
		return
	}

	//get the userID from the context
	userID, err := GetID(r.Context())
	if err != nil {
		s.logger.Warn("invalid userID", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid userID")
		return
	}

	//validate the user input
	if err := s.validator.Struct(createDto); err != nil {
		s.logger.Warn("invalid user input",
			zap.Error(err),
			zap.Any("payload", createDto),
		)
		respondWithJSON(w, http.StatusBadRequest, nil, "malformed input")
		return
	}

	//covnert to the domain model
	createDom, err := createDto.ToModel(userID)
	if err != nil {
		s.logger.Warn("failed to convert domain Model", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "nahh man")
		return
	}

	err = s.bookingService.CreateNewBooking(r.Context(), createDom)

	if err != nil {
		s.logger.Warn("failed to create booking", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to craete booking")
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "successfully created the booking")

}
