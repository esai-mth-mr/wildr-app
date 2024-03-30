package transport

import (
	"context"
	"errors"
	"fmt"
	"net"

	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"

	"go.uber.org/fx"
)

// ErrInvalidPort for transport.
var ErrInvalidPort = errors.New("invalid port")

// RegisterParams for transport.
type RegisterParams struct {
	fx.In

	Lifecycle fx.Lifecycle
	Config    *Config
	HTTP      *http.Server
	GRPC      *grpc.Server
}

// Register all the transports.
func Register(params RegisterParams) {
	s := &server{cfg: params.Config, http: params.HTTP, grpc: params.GRPC}

	params.Lifecycle.Append(fx.Hook{
		OnStart: func(context.Context) error {
			return s.Start()
		},
		OnStop: func(ctx context.Context) error {
			s.Stop(ctx)

			return nil
		},
	})
}

// Server handles all the transports.
type server struct {
	cfg  *Config
	http *http.Server
	grpc *grpc.Server
}

// Start all the servers.
func (s *server) Start() error {
	gl, err := s.listener(s.cfg.GRPC.Port)
	if err != nil {
		return err
	}

	hl, err := s.listener(s.cfg.HTTP.Port)
	if err != nil {
		return err
	}

	go s.grpc.Start(gl)
	go s.http.Start(hl)

	return nil
}

// Stop all the servers.
func (s *server) Stop(ctx context.Context) {
	s.grpc.Stop(ctx)
	s.http.Stop(ctx)
}

func (s *server) listener(port string) (net.Listener, error) {
	if port == "" {
		return nil, ErrInvalidPort
	}

	return net.Listen("tcp", fmt.Sprintf(":%s", port))
}
