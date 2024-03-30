package time

import (
	"time"
)

const (
	Timeout = 30 * time.Second
	Backoff = 100 * time.Millisecond
)

func ToMilliseconds(duration time.Duration) int64 {
	return duration.Nanoseconds() / 1e6
}
