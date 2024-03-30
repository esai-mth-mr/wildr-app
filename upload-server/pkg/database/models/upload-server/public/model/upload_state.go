package model

import (
	"time"
)

type UploadState struct {
	ID             string `sql:"primary_key"`
	UserID         string
	State          int
	IdempotencyKey string
	FilePath       string
	FileType       string
	CheckSum       string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
