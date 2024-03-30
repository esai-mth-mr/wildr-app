package observer

import (
	health_http "github.com/wildr-inc/app/genesis/pkg/health/transport/http"

	"github.com/alexfalkowski/go-health/server"
)

func readinessObserver(
	healthServer *server.Server,
) *health_http.HttpReadinessObserver {
	return &health_http.HttpReadinessObserver{
		Observer: healthServer.Observe("http"),
	}
}
