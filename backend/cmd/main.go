package main

import (
	"context"
	"fmt"
	"log"
	"t/internal/auth"
	"t/internal/booking"
	"t/internal/config"
	"t/internal/facility"
	"t/internal/penalty"
	"t/internal/registration"
	"t/internal/review"
	"t/internal/schedule"
	"t/internal/session"
	"t/internal/trainer"
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

	//create facility
	facilRep := facility.NewFacilityRepositoryPostgres(pGpool)
	facilSrv := facility.NewFacilityService(facilRep)

	//create bookings
	bookingRep := booking.NewBookingRepositoryPostgres(pGpool)
	bookingSrv := booking.NewBookingService(bookingRep)

	//create reviews
	reviewRep := review.NewReviewRepositoryPostgres(pGpool)
	reviewSrv := review.NewReviewService(reviewRep)

	//create trainer
	trainerRep := trainer.NewTrainerRepositoryPostgres(pGpool)
	trainerSrv := trainer.NewTrainerService(trainerRep)

	//create session
	sessionRep := session.NewSessionRepositoryPostgres(pGpool)
	sessionSrv := session.NewSessionService(sessionRep)

	//create schedule
	scheduleRep := schedule.NewScheduleRepositoryPostgres(pGpool)
	scheduleSrv := schedule.NewScheduleService(scheduleRep)

	//create registration
	registrationRep := registration.NewRegistrationRepositoryPostgres(pGpool)
	registrationSrv := registration.NewRegistrationService(registrationRep)

	//create penalty
	penaltyRep := penalty.NewPenaltyRepositoryPostgres(pGpool)
	penaltySrv := penalty.NewPenaltyService(penaltyRep)

	srv := http.NewServer(":8080", userSrvs, authSrv, facilSrv, bookingSrv, reviewSrv, trainerSrv, sessionSrv, scheduleSrv, registrationSrv, penaltySrv)

	srv.Start()

}
