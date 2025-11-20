package http

import (
	"context"
	"net/http"
	"t/internal/auth"
	"t/internal/facility"
	"t/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type Server struct {
	router          *chi.Mux
	httpServer      *http.Server
	userService     *user.UserService
	authService     *auth.AuthService
	facilityService *facility.FacilityService
	validator       *validator.Validate
	logger          *zap.Logger
}

func NewServer(addr string, userSrv *user.UserService, authSrv *auth.AuthService, facilSrv *facility.FacilityService) *Server {
	router := chi.NewMux()

	validator := validator.New(validator.WithRequiredStructEnabled())

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	s := &Server{
		httpServer: &http.Server{
			Addr:    addr,
			Handler: router, // here httpServer uses router to route the incoming request
		},
		logger:          logger,
		facilityService: facilSrv,
		validator:       validator,
		userService:     userSrv,
		authService:     authSrv,
		router:          router, // our application also needs this router to set up routes/middlewares so they will be reflected in the httpServer
	}

	s.registerHandlers()

	return s

}

func (s *Server) registerHandlers() {
	s.router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://your-frontend.com"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
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

			pro.Get("/facility/{id}", s.GetFacilityHandler)
			pro.Patch("/facility/{id}", s.UpdateFacilityHandler)
			pro.Get("/facility/all", s.ListFacilitiesHandler)
			pro.Post("/facility", s.CreateFacilityHandler)
			pro.Delete("/facility/{id}", s.DeleteFacilityHandler)
		})

	})
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func (s *Server) ShutDown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
