package tracer

import (
	"context"

	"github.com/wildr-inc/app/genesis/pkg/env"
	"github.com/wildr-inc/app/genesis/pkg/os"
	"github.com/wildr-inc/app/genesis/pkg/version"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	trace_sdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/otel/trace"
	"go.opentelemetry.io/otel/trace/noop"
	"go.uber.org/fx"
)

// Register for tracer.
func Register() {
	otel.SetTextMapPropagator(propagation.TraceContext{})
}

// NewNoopTracer for tracer.
func NewNoopTracer(name string) trace.Tracer {
	return noop.NewTracerProvider().Tracer(name)
}

// NewTracer for tracer.
func NewTracer(
	ctx context.Context,
	lc fx.Lifecycle,
	name string,
	env env.Environment,
	ver version.Version,
	cfg *Config,
) (trace.Tracer, error) {
	if cfg.Host == "" {
		return NewNoopTracer(name), nil
	}

	opts := []otlptracehttp.Option{otlptracehttp.WithEndpoint(cfg.Host)}

	if !cfg.Secure {
		opts = append(opts, otlptracehttp.WithInsecure())
	}

	client := otlptracehttp.NewClient(opts...)

	exporter, err := otlptrace.New(ctx, client)
	if err != nil {
		return nil, err
	}

	attrs := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceName(name),
		semconv.ServiceVersion(string(ver)),
		semconv.DeploymentEnvironment(string(env)),
		attribute.String("name", os.ExecutableName()),
	)

	tracerOpts := []trace_sdk.TracerProviderOption{
		trace_sdk.WithResource(attrs),
	}

	if env.IsDevelopment() {
		tracerOpts = append(tracerOpts, trace_sdk.WithSyncer(exporter))
	} else {
		tracerOpts = append(tracerOpts, trace_sdk.WithBatcher(exporter))
	}

	p := trace_sdk.NewTracerProvider(tracerOpts...)

	otel.SetTracerProvider(p)
	otel.SetErrorHandler(&errorHandler{})

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			return p.Shutdown(ctx)
		},
	})

	return p.Tracer(name), nil
}

type errorHandler struct{}

func (*errorHandler) Handle(_ error) {
}
