package uploadstateentity

import "time"

type UploadState int

const (
	StateInProgress UploadState = iota + 1
	StateComplete
	StateReferenced
)

type UploadStateEntity struct {
	ID             string
	UserID         string
	State          UploadState
	IdempotencyKey string
	FilePath       string
	FileType       string
	CheckSum       string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
