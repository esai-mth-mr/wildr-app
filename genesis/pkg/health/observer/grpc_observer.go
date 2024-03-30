package observer

import (
	health_grpc "github.com/wildr-inc/app/genesis/pkg/health/transport/grpc"

	"github.com/alexfalkowski/go-health/server"
)

func grpcObserver(healthServer *server.Server) *health_grpc.Observer {
	return &health_grpc.Observer{Observer: healthServer.Observe("http")}
}
