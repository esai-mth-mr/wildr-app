package http

import (
	"github.com/alexfalkowski/go-health/subscriber"
)

// HttpHealthObserver for HTTP.
type HttpHealthObserver struct {
	*subscriber.Observer
}

// HttpLivenessObserver for HTTP.
type HttpLivenessObserver struct {
	*subscriber.Observer
}

// HttpReadinessObserver for HTTP.
type HttpReadinessObserver struct {
	*subscriber.Observer
}
