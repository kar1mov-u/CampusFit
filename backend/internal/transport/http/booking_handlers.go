package http

import (
	"encoding/json"
	"net/http"
	"strconv"
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
		respondWithJSON(w, http.StatusInternalServerError, nil, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "successfully created the booking")

}

func (s *Server) ListFacilityBookingsHandler(w http.ResponseWriter, r *http.Request) {
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
		return
	}

	bookings, err := s.bookingService.ListBookingsForFacility(r.Context(), facilID, date)
	if err != nil {
		s.logger.Warn("failed to list bookings", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to list bookings")
		return
	}

	resp := make([]dto.BookingResponse, 0, len(bookings))
	for _, b := range bookings {
		i := dto.ToBookingResponse(b)
		resp = append(resp, i)
	}

	respondWithJSON(w, http.StatusOK, resp, "successfully listed")

}

func (s *Server) ListUserBookingsHandler(w http.ResponseWriter, r *http.Request) {
	//first it should be user itself or the admin to access users bookings
	pathIDstr := chi.URLParam(r, "id")
	pathID, err := uuid.Parse(pathIDstr)
	if err != nil {
		s.logger.Warn("invalid userID in path parameter", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid userID in path")
		return
	}

	userID, err := GetID(r.Context())
	if err != nil {
		s.logger.Warn("invalid userID from context", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid userID in context")
		return
	}

	// if id's do not mathc then user should be the admin!!!
	if pathID != userID && !s.authService.IsAdmin(r.Context(), userID) {
		s.logger.Warn("user is not admin and not requesting its own data")
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

	resp, err := s.bookingService.ListBookingForUser(r.Context(), userID, offset)
	if err != nil {
		s.logger.Warn("failed to list bookingsUser", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to list bookigs")
		return
	}

	respDto := make([]dto.BookingResponse, 0)
	for _, b := range resp {

		i := dto.ToBookingResponse(b)

		respDto = append(respDto, i)
	}

	respondWithJSON(w, http.StatusOK, respDto, "successfuly listed bookings")

}

func (s *Server) ListBookingsHandler(w http.ResponseWriter, r *http.Request) {

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

	//get query parameters
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

	startDateStr := r.URL.Query().Get("start_date")
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		s.logger.Warn("failed to parse the query start_date to correct format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid start_date format, expected YYYY-MM-DD:")
		return
	}

	endtDateStr := r.URL.Query().Get("date")
	endDate, err := time.Parse("2006-01-02", endtDateStr)
	if err != nil {
		s.logger.Warn("failed to parse the query end_date to correct format", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "invalid end_date format, expected YYYY-MM-DD:")
		return
	}

	bookngs, err := s.bookingService.ListBookings(r.Context(), startDate, endDate, offset)
	if err != nil {
		s.logger.Warn("failed to list bookings", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to list bookings")
		return
	}

	bookingsDto := make([]dto.BookingResponse, 0, len(bookngs))
	for _, booking := range bookngs {
		i := dto.ToBookingResponse(booking)

		bookingsDto = append(bookingsDto, i)
	}
	respondWithJSON(w, http.StatusOK, bookingsDto, "successfuly listed bookings")
}

func (s *Server) CancelBookingHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "booking_id")
	if idStr == "" {
		s.logger.Warn("missing bookingID on path parameter")
		http.Error(w, "missing booking id", http.StatusBadRequest)
		return
	}

	bookingID, err := uuid.Parse(idStr)
	if err != nil {
		s.logger.Warn("invalid booking on path parameter")
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req struct {
		AdminNote string `json:"admin_note"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.logger.Warn("failed to decode input", zap.Error(err))
		respondWithJSON(w, http.StatusBadRequest, nil, "malformed input")
		return
	}

	err = s.bookingService.CancelBooking(r.Context(), bookingID, req.AdminNote)
	if err != nil {
		s.logger.Warn("failed to cancel booking", zap.Error(err))
		respondWithJSON(w, http.StatusInternalServerError, nil, "failed to cancel booking")
		return
	}
	respondWithJSON(w, http.StatusOK, nil, "successfully canceled booking")
}
