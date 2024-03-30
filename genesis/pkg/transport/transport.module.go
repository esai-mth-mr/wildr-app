package transport

import (
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	gtracer "github.com/wildr-inc/app/genesis/pkg/transport/grpc/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	htracer "github.com/wildr-inc/app/genesis/pkg/transport/http/telemetry/tracer"

	"go.uber.org/fx"
)

var (
	// GRPCModule for fx.
	GRPCModule = fx.Options(
		fx.Provide(grpc.NewServer),
		fx.Provide(gtracer.NewTracer),
	)

	// HTTPModule for fx.
	HTTPModule = fx.Options(
		fx.Provide(http.NewServer),
		fx.Provide(htracer.NewTracer),
	)

	// Module for fx.
	Module = fx.Options(
		GRPCModule,
		HTTPModule,
		fx.Invoke(Register),
	)
)
