package http

import (
	"context"
	"net/http"
	"t/internal/auth"
	"t/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
)

type Server struct {
	router      *chi.Mux
	httpServer  *http.Server
	userService *user.UserService
	authService *auth.AuthService
	validator   *validator.Validate
}

func NewServer(addr string, userSrv *user.UserService, authSrv *auth.AuthService) *Server {
	router := chi.NewMux()

	validator := validator.New(validator.WithRequiredStructEnabled())

	s := &Server{
		httpServer: &http.Server{
			Addr:    addr,
			Handler: router, // here httpServer uses router to route the incoming request
		},
		validator:   validator,
		userService: userSrv,
		authService: authSrv,
		router:      router, // our application also needs this router to set up routes/middlewares so they will be reflected in the httpServer
	}

	s.registerHandlers()

	return s

}

func (s *Server) registerHandlers() {
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
			pro.Get("/users", s.WhoAmI)
		})

	})
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func (s *Server) ShutDown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
