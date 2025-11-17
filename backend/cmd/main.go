package main

import (
	"context"
	"fmt"
	"log"
	"t/internal/auth"
	"t/internal/config"
	"t/internal/transport/http"
	"t/internal/user"
	pg "t/pkg/postgres"
)

func main() {
	cfg := config.Load()
	fmt.Println(cfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	// postgres://user:password@host:port/database
	dbConnString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", cfg.DBUser, cfg.DBPass, cfg.DBHost, cfg.DBPort, cfg.DBName)
	pGpool := pg.New(ctx, dbConnString)
	log.Printf("connected to database")
	//creating user repo/service
	userRepo := user.NewUserRepositotyPostgres(pGpool)
	userSrvs := user.NewUserService(userRepo)

	//creating auth service

	//to-do  (change to read key from the .env)
	authSrv := auth.NewAuthSerivce(cfg.JWTKey, userRepo)

	srv := http.NewServer(":8181", userSrvs, authSrv)

	srv.Start()

}
