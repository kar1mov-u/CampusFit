package http

import (
	"net/http"
	"t/internal/service"
)

type HttpServer struct {
	userService *service.UserService
}

func (httpS *HttpServer) CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	//first turn to DTO

}
