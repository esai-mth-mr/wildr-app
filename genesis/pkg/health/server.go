package health

import (
	"context"

	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"

	"github.com/alexfalkowski/go-health/server"
	"go.uber.org/fx"
)

// NewServer for health.
func NewServer(
	lc fx.Lifecycle,
	regs health_registrations.Registrations,
) *server.Server {
	s := server.NewServer()

	s.Register(regs...)

	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			s.Start()

			return nil
		},
		OnStop: func(ctx context.Context) error {
			s.Stop()

			return nil
		},
	})

	return s
}
