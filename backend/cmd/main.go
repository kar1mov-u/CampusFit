package main

import (
	"context"
	"fmt"
	"log"
	"t/internal/config"
	"t/pkg/postgres"
)

func main() {
	cfg := config.Load()
	fmt.Println(cfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	// postgres://user:password@host:port/database
	dbConnString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", cfg.DBUser, cfg.DBPass, cfg.DBHost, cfg.DBPort, cfg.DBName)
	_ = postgres.New(ctx, dbConnString)
	log.Printf("connected to database")

}
