package tracer

import (
	"context"

	"github.com/wildr-inc/app/genesis/pkg/env"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/version"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
)

// Params for tracer.
type Params struct {
	fx.In

	Lifecycle   fx.Lifecycle
	Config      *tracer.Config
	Environment env.Environment
	Version     version.Version
}

// NewTracer for tracer.
func NewTracer(params Params) (Tracer, error) {
	return tracer.NewTracer(
		context.Background(),
		params.Lifecycle,
		"pg",
		params.Environment,
		params.Version,
		params.Config,
	)
}

// Tracer for tracer.
type Tracer trace.Tracer
