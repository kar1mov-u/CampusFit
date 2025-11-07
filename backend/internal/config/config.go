package config

import (
	"log"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	DBHost string `env:"DB_HOST"`
	DBPort string `env:"DB_PORT" envDefault:"5432"`
	DBUser string `env:"DB_USER"`
	DBPass string `env:"DB_PASS"`
	DBName string `env:"DB_NAME"`
}

func Load() Config {
	var cnf Config
	if err := godotenv.Load("../.env"); err != nil {
		log.Fatal("cannot parse .env", err)

	}
	err := env.Parse(&cnf)
	if err != nil {
		log.Fatal("cannot parse .env", err)
	}
	return cnf
}
