package observer

import (
	health_http "github.com/wildr-inc/app/genesis/pkg/health/transport/http"

	"github.com/alexfalkowski/go-health/server"
)

func livenessObserver(
	healthServer *server.Server,
) *health_http.HttpLivenessObserver {
	return &health_http.HttpLivenessObserver{
		Observer: healthServer.Observe("http"),
	}
}
