package http

import (
	"encoding/json"
	"net/http"
	"t/internal/transport/dto"
	"time"

	// "github.com/pingcap/log"
	// "github.com/pingcap/log"s
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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

func (s *Server) ListBookingsHandler(w http.ResponseWriter, r *http.Request) {
	//get the facil id from the path
	idStr := chi.URLParam(r, "facility_id")
	if idStr == "" {
		s.logger.Warn("missing facilityID on path parameter")
		http.Error(w, "missing facility id", http.StatusBadRequest)
		return
	}

	facilID, err := uuid.Parse(idStr)
	if err != nil {
		s.logger.Warn("invalid facilityID on path parameter")
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	//get the date from the query parameters
	dateStr := r.URL.Query().Get("date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		s.logger.Warn("failed to parse the query date to correct format", zap.Error(err))

		respondWithJSON(w, http.StatusBadRequest, nil, "invalid date format, expected YYYY-MM-DD:")
	}

	bookings, err := s.bookingService.ListBookings(r.Context(), facilID, date)
	if err != nil {
		s.logger.Warn("failed to list bookings", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to list bookings")
	}

	resp := make([]dto.BookingResponse, 0, len(bookings))
	for _, b := range bookings {
		i := dto.ToBookingResponse(b)
		resp = append(resp, i)
	}

	respondWithJSON(w, http.StatusOK, resp, "successfully listed")

}
