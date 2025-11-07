package models

import "github.com/google/uuid"

type User struct {
	ID        uuid.UUID
	Email     string
	FristName string
	LastName  string
	Role      string // gonna have 3 types of roles 1)Student, Staff, Admin
}
