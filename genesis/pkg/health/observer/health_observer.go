package observer

import (
	health_http "github.com/wildr-inc/app/genesis/pkg/health/transport/http"

	"github.com/alexfalkowski/go-health/server"
)

func healthObserver(
	healthServer *server.Server,
) (*health_http.HttpHealthObserver, error) {
	return &health_http.HttpHealthObserver{
		Observer: healthServer.Observe("http"),
	}, nil
}
