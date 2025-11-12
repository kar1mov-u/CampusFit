package http

import (
	"context"
	"net/http"
	"t/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

type Server struct {
	router      *chi.Mux
	httpServer  *http.Server
	userService *service.UserService
	validator   *validator.Validate
}

func NewServer(addr string, userSrv *service.UserService) *Server {
	router := chi.NewMux()

	validator := validator.New(validator.WithRequiredStructEnabled())

	s := &Server{
		httpServer: &http.Server{
			Addr:    addr,
			Handler: router, // here httpServer uses router to route the incoming request
		},
		validator:   validator,
		userService: userSrv,
		router:      router, // our application also needs this router to set up routes/middlewares so they will be reflected in the httpServer
	}

	s.registerHandlers()

	return s

}

func (s *Server) registerHandlers() {
	s.router.Route("/api/v1", func(r chi.Router) {
		r.Post("/users", s.CreateUserHandler)
	})
}

func (s *Server) Start() error {
	return s.httpServer.ListenAndServe()
}

func (s *Server) ShutDown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}
