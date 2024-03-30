package test

import (
	"context"
	"errors"
	"fmt"

	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	transport_grpc "github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	grpc_tracer "github.com/wildr-inc/app/genesis/pkg/transport/grpc/telemetry/tracer"
	transport_http "github.com/wildr-inc/app/genesis/pkg/transport/http"
	http_tracer "github.com/wildr-inc/app/genesis/pkg/transport/http/telemetry/tracer"
	v1 "github.com/wildr-inc/app/genesis/test/greet/v1"

	"github.com/urfave/negroni/v3"
	"go.opentelemetry.io/otel/metric"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// ErrInvalidToken ...
var ErrInvalidToken = errors.New("invalid token")

// NewServer ...
func NewServer(verifyAuth bool) *Server {
	return &Server{verifyAuth: verifyAuth}
}

// Server ...
type Server struct {
	verifyAuth bool
	v1.UnimplementedGreeterServiceServer
}

// SayHello ...
func (s *Server) SayHello(
	ctx context.Context,
	req *v1.SayHelloRequest,
) (*v1.SayHelloResponse, error) {
	if s.verifyAuth && Test(ctx) != "auth" {
		return nil, ErrInvalidToken
	}

	return &v1.SayHelloResponse{
		Message: fmt.Sprintf("Hello %s", req.GetName()),
	}, nil
}

// SayStreamHello ...
func (s *Server) SayStreamHello(
	stream v1.GreeterService_SayStreamHelloServer,
) error {
	if s.verifyAuth && Test(stream.Context()) != "auth" {
		return ErrInvalidToken
	}

	req, err := stream.Recv()
	if err != nil {
		return err
	}

	return stream.Send(
		&v1.SayStreamHelloResponse{
			Message: fmt.Sprintf("Hello %s", req.GetName()),
		},
	)
}

// NewHTTPServer for test.
func NewHTTPServer(
	lc fx.Lifecycle,
	logger *zap.Logger,
	cfg *tracer.Config,
	tcfg *transport.Config,
	meter metric.Meter,
	handlers []negroni.Handler,
) *transport_http.Server {
	tracer, _ := http_tracer.NewTracer(
		http_tracer.Params{Lifecycle: lc, Config: cfg, Version: Version},
	)

	server, _ := transport_http.NewServer(transport_http.ServerParams{
		Shutdowner: NewShutdowner(), Config: &tcfg.HTTP, Logger: logger,
		Tracer: tracer, Meter: meter, Handlers: handlers,
	})

	return server
}

// NewGRPCServer for test.
func NewGRPCServer(
	fxLifecycle fx.Lifecycle,
	logger *zap.Logger,
	cfg *tracer.Config,
	transportConfig *transport.Config,
	verifyAuth bool,
	meter metric.Meter,
	unary []grpc.UnaryServerInterceptor,
	stream []grpc.StreamServerInterceptor,
) *transport_grpc.Server {
	tracer, _ := grpc_tracer.NewTracer(
		grpc_tracer.Params{Lifecycle: fxLifecycle, Config: cfg, Version: Version},
	)

	server, err := transport_grpc.NewServer(transport_grpc.ServerParams{
		Shutdowner: NewShutdowner(),
		Config:     &transportConfig.GRPC,
		Logger:     logger,
		Tracer:     tracer,
		Meter:      meter,
		Unary:      unary,
		Stream:     stream,
	})
	if err != nil {
		logger.Error("failure creating grpc server", zap.Error(err))
		panic(err)
	}

	fmt.Print("Registering GreeterServiceServer", server)
	v1.RegisterGreeterServiceServer(server.Server, NewServer(verifyAuth))

	return server
}

// RegisterTransport for test.
func RegisterTransport(
	lc fx.Lifecycle,
	cfg *transport.Config,
	gs *transport_grpc.Server,
	hs *transport_http.Server,
) {
	transport.Register(
		transport.RegisterParams{
			Lifecycle: lc,
			Config:    cfg,
			HTTP:      hs,
			GRPC:      gs,
		},
	)
}
