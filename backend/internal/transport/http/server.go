package http

import (
	"context"
	"net/http"
	"t/internal/auth"
	"t/internal/booking"
	"t/internal/facility"
	"t/internal/penalty"
	"t/internal/registration"
	"t/internal/review"
	"t/internal/schedule"
	"t/internal/session"
	"t/internal/trainer"
	"t/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type Server struct {
	router              *chi.Mux
	httpServer          *http.Server
	userService         *user.UserService
	authService         *auth.AuthService
	facilityService     *facility.FacilityService
	bookingService      *booking.BookingService
	reviewService       *review.ReviewService
	trainerService      *trainer.TrainerService
	sessionService      *session.SessionService
	scheduleService     *schedule.ScheduleService
	registrationService *registration.RegistrationService
	penaltyService      *penalty.PenaltyService
	validator           *validator.Validate
	logger              *zap.Logger
}

func NewServer(addr string, userSrv *user.UserService, authSrv *auth.AuthService, facilSrv *facility.FacilityService, bookSrv *booking.BookingService, reviewSrv *review.ReviewService, trainerSrv *trainer.TrainerService, sessionSrv *session.SessionService, scheduleSrv *schedule.ScheduleService, registrationSrv *registration.RegistrationService, penaltySrv *penalty.PenaltyService) *Server {
	router := chi.NewMux()

	validator := validator.New(validator.WithRequiredStructEnabled())

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	s := &Server{
		httpServer: &http.Server{
			Addr:    addr,
			Handler: router, // here httpServer uses router to route the incoming request
		},
		logger:              logger,
		facilityService:     facilSrv,
		validator:           validator,
		userService:         userSrv,
		bookingService:      bookSrv,
		reviewService:       reviewSrv,
		trainerService:      trainerSrv,
		sessionService:      sessionSrv,
		scheduleService:     scheduleSrv,
		registrationService: registrationSrv,
		penaltyService:      penaltySrv,
		authService:         authSrv,
		router:              router, // our application also needs this router to set up routes/middlewares so they will be reflected in the httpServer
	}

	s.registerHandlers()

	return s

}

func (s *Server) registerHandlers() {
	s.router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:80", "http://0.0.0.0:80"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // maximum age for preflight request cache
	}))
	s.router.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.Logger)

		//public routes
		r.Group(func(pub chi.Router) {
			pub.Post("/auth/login", s.LoginHandler)
			pub.Post("/users", s.CreateUserHandler)
		})

		//	protected routes
		r.Group(func(pro chi.Router) {
			pro.Use(s.authService.JWTMiddleware)

			pro.Get("/users/{id}", s.GetUserHandler)
			pro.Get("/users/me", s.WhoAmI)
			pro.Get("/users", s.ListUsersHandler)

			pro.Get("/users/{id}/bookings", s.ListUserBookingsHandler)

			//handler to get just 1 facility
			pro.Get("/facility/{id}", s.GetFacilityHandler)
			//handler to update the facility
			pro.Patch("/facility/{id}", s.UpdateFacilityHandler)

			pro.Get("/facility/all", s.ListFacilitiesHandler)
			//craete facility
			pro.Post("/facility", s.CreateFacilityHandler)
			//delete facility
			pro.Delete("/facility/{id}", s.DeleteFacilityHandler)

			pro.Post("/bookings", s.CreateBookingHandler)
			pro.Post("/bookings/cancel/{booking_id}", s.CancelBookingHandler)
			pro.Get("/bookings", s.ListBookingsHandler)
			pro.Get("/bookings/facility/{facility_id}", s.ListFacilityBookingsHandler)

			// Review endpoints
			pro.Post("/facility/{facility_id}/review", s.CreateFacilityReviewHandler)
			pro.Delete("/facility/review/{review_id}", s.DeleteFacilityReviewHandler)
			pro.Get("/facility/{facility_id}/reviews", s.GetFacilityReviewsHandler)
			pro.Get("/facility/{facility_id}/rating", s.GetFacilityRatingHandler)

			// Trainer endpoints
			pro.Post("/trainers", s.CreateTrainerHandler)
			pro.Get("/trainers", s.ListTrainersHandler)
			pro.Get("/trainers/{id}", s.GetTrainerHandler)
			pro.Patch("/trainers/{id}", s.UpdateTrainerHandler)
			pro.Delete("/trainers/{id}", s.DeleteTrainerHandler)

			// Schedule endpoints
			pro.Post("/schedules", s.CreateScheduleHandler)
			pro.Delete("/schedules/{id}", s.DeleteScheduleHandler)
			pro.Get("/schedules/trainer/{trainer_id}", s.ListTrainerSchedulesHandler)
			pro.Get("/schedules/facility/{facility_id}", s.ListFacilitySchedulesHandler)

			// Session endpoints
			pro.Post("/sessions", s.CreateSessionHandler)
			pro.Delete("/sessions/{id}", s.DeleteSessionHandler)
			pro.Post("/sessions/cancel/{id}", s.CancelSessionHandler)
			pro.Get("/sessions/facility/{facility_id}", s.ListFacilitySessionsHandler)
			pro.Get("/sessions/trainer/{trainer_id}", s.ListTrainerSessionsHandler)

			// Registration endpoints
			pro.Post("/registrations", s.CreateRegistrationHandler)
			pro.Post("/registrations/cancel/{id}", s.CancelRegistrationHandler)
			pro.Get("/registrations/session/{session_id}", s.ListSessionRegistrationsHandler)
			pro.Get("/registrations/user/{user_id}", s.ListUserRegistrationsHandler)

			// Penalty endpoints
			pro.Post("/penalties", s.CreatePenaltyHandler)
			pro.Delete("/penalties/{id}", s.DeletePenaltyHandler)
			pro.Get("/penalties/user/{id}", s.ListPenaltyForUserHandler)
			pro.Get("/penalties/given/{id}", s.ListGivenPenaltyByUserHandler)
			pro.Get("/penalties/interval", s.ListPenaltiesIntervalHandler)
		})

	})
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func (s *Server) ShutDown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
