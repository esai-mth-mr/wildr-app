package grpc_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/health"
	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"
	health_grpc "github.com/wildr-inc/app/genesis/pkg/health/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc/security/token"
	"github.com/wildr-inc/app/genesis/test"

	"github.com/alexfalkowski/go-health/checker"
	"github.com/alexfalkowski/go-health/server"
	"github.com/alexfalkowski/go-health/subscriber"
	. "github.com/smartystreets/goconvey/convey" //nolint:revive
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health/grpc_health_v1"
)

func init() {
	tracer.Register()
}

//nolint:dupl
func TestUnary(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		lifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lifecycle)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(lifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: lifecycle, Port: "6000"},
		)
		observer := observer(
			lifecycle,
			"http://localhost:6000/v1/status/200",
			test.NewHTTPClient(lifecycle, logger, test.NewTracerConfig(), cfg, meter),
		)
		httpServer := test.NewHTTPServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			nil,
			nil,
		)

		test.RegisterTransport(lifecycle, cfg, grpcServer, httpServer)

		health_grpc.Register(grpcServer, &health_grpc.Observer{Observer: observer})
		lifecycle.RequireStart()
		time.Sleep(1 * time.Second)

		Convey("When I query health", func() {
			ctx := context.Background()
			conn := test.NewGRPCClient(
				ctx,
				lifecycle,
				logger,
				cfg,
				test.NewTracerConfig(),
				nil,
				meter,
			)
			defer conn.Close()

			client := grpc_health_v1.NewHealthClient(conn)
			req := &grpc_health_v1.HealthCheckRequest{}

			resp, err := client.Check(ctx, req)
			So(err, ShouldBeNil)

			lifecycle.RequireStop()

			Convey("Then I should have a healthy response", func() {
				So(
					resp.GetStatus(),
					ShouldEqual,
					grpc_health_v1.HealthCheckResponse_SERVING,
				)
			})
		})
	})
}

//nolint:dupl
func TestInvalidUnary(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(lc, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: lc, Port: "6000"},
		)

		o := observer(
			lc,
			"http://localhost:6000/v1/status/500",
			test.NewHTTPClient(lc, logger, test.NewTracerConfig(), cfg, meter),
		)
		hs := test.NewHTTPServer(
			lc,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		gs := test.NewGRPCServer(
			lc,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			nil,
			nil,
		)

		test.RegisterTransport(lc, cfg, gs, hs)
		health_grpc.Register(gs, &health_grpc.Observer{Observer: o})
		lc.RequireStart()
		time.Sleep(1 * time.Second)

		Convey("When I query health", func() {
			ctx := context.Background()
			conn := test.NewGRPCClient(
				ctx,
				lc,
				logger,
				cfg,
				test.NewTracerConfig(),
				nil,
				meter,
			)
			defer conn.Close()

			client := grpc_health_v1.NewHealthClient(conn)
			req := &grpc_health_v1.HealthCheckRequest{}

			resp, err := client.Check(ctx, req)
			So(err, ShouldBeNil)

			lc.RequireStop()

			Convey("Then I should have an unhealthy response", func() {
				So(
					resp.GetStatus(),
					ShouldEqual,
					grpc_health_v1.HealthCheckResponse_NOT_SERVING,
				)
			})
		})
	})
}

func TestIgnoreAuthUnary(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(lc, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: lc, Port: "6000"},
		)

		o := observer(
			lc,
			"http://localhost:6000/v1/status/200",
			test.NewHTTPClient(lc, logger, test.NewTracerConfig(), cfg, m),
		)
		verifier := test.NewVerifier("test")
		hs := test.NewHTTPServer(
			lc,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		gs := test.NewGRPCServer(
			lc,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			m,
			[]grpc.UnaryServerInterceptor{
				token.UnaryServerInterceptor(verifier),
			},
			[]grpc.StreamServerInterceptor{
				token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(lc, cfg, gs, hs)
		health_grpc.Register(gs, &health_grpc.Observer{Observer: o})
		lc.RequireStart()
		time.Sleep(1 * time.Second)

		Convey("When I query health", func() {
			ctx := context.Background()
			conn := test.NewGRPCClient(
				ctx,
				lc,
				logger,
				cfg,
				test.NewTracerConfig(),
				nil,
				m,
			)
			defer conn.Close()

			client := grpc_health_v1.NewHealthClient(conn)
			req := &grpc_health_v1.HealthCheckRequest{}

			resp, err := client.Check(ctx, req)
			So(err, ShouldBeNil)

			lc.RequireStop()

			Convey("Then I should have a healthy response", func() {
				So(
					resp.GetStatus(),
					ShouldEqual,
					grpc_health_v1.HealthCheckResponse_SERVING,
				)
			})
		})
	})
}

//nolint:dupl
func TestStream(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		lifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lifecycle)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(lifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: lifecycle, Port: "6000"},
		)

		observer := observer(
			lifecycle,
			"http://localhost:6000/v1/status/200",
			test.NewHTTPClient(lifecycle, logger, test.NewTracerConfig(), cfg, meter),
		)
		httpServer := test.NewHTTPServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			nil,
			nil,
		)

		test.RegisterTransport(lifecycle, cfg, grpcServer, httpServer)
		health_grpc.Register(grpcServer, &health_grpc.Observer{Observer: observer})
		lifecycle.RequireStart()
		time.Sleep(1 * time.Second)

		Convey("When I query health", func() {
			ctx := context.Background()
			conn := test.NewGRPCClient(
				ctx,
				lifecycle,
				logger,
				cfg,
				test.NewTracerConfig(),
				nil,
				meter,
			)
			defer conn.Close()

			client := grpc_health_v1.NewHealthClient(conn)
			req := &grpc_health_v1.HealthCheckRequest{}

			wc, err := client.Watch(ctx, req)
			So(err, ShouldBeNil)

			resp, err := wc.Recv()
			So(err, ShouldBeNil)

			lifecycle.RequireStop()

			Convey("Then I should have a healthy response", func() {
				So(
					resp.GetStatus(),
					ShouldEqual,
					grpc_health_v1.HealthCheckResponse_SERVING,
				)
			})
		})
	})
}

//nolint:dupl
func TestInvalidStream(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		lifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lifecycle)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(lifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		observer := observer(
			lifecycle,
			"http://localhost:6000/v1/status/500",
			test.NewHTTPClient(lifecycle, logger, test.NewTracerConfig(), cfg, meter),
		)
		httpServer := test.NewHTTPServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			nil,
			nil,
		)

		test.RegisterTransport(lifecycle, cfg, grpcServer, httpServer)
		health_grpc.Register(grpcServer, &health_grpc.Observer{Observer: observer})
		lifecycle.RequireStart()
		time.Sleep(1 * time.Second)

		Convey("When I query health", func() {
			ctx := context.Background()
			conn := test.NewGRPCClient(
				ctx,
				lifecycle,
				logger,
				cfg,
				test.NewTracerConfig(),
				nil,
				meter,
			)
			defer conn.Close()

			client := grpc_health_v1.NewHealthClient(conn)
			req := &grpc_health_v1.HealthCheckRequest{}

			wc, err := client.Watch(ctx, req)
			So(err, ShouldBeNil)

			resp, err := wc.Recv()
			So(err, ShouldBeNil)

			lifecycle.RequireStop()

			Convey("Then I should have a healthy response", func() {
				So(
					resp.GetStatus(),
					ShouldEqual,
					grpc_health_v1.HealthCheckResponse_NOT_SERVING,
				)
			})
		})
	})
}

func TestIgnoreAuthStream(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		lifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lifecycle)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(lifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: lifecycle, Port: "6000"},
		)

		statusObserver := observer(
			lifecycle,
			"http://localhost:6000/v1/status/200",
			test.NewHTTPClient(lifecycle, logger, test.NewTracerConfig(), cfg, meter),
		)
		verifier := test.NewVerifier("test")
		httpServer := test.NewHTTPServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			lifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			[]grpc.UnaryServerInterceptor{
				token.UnaryServerInterceptor(verifier),
			},
			[]grpc.StreamServerInterceptor{
				token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(lifecycle, cfg, grpcServer, httpServer)
		health_grpc.Register(grpcServer, &health_grpc.Observer{Observer: statusObserver})
		lifecycle.RequireStart()
		time.Sleep(1 * time.Second)

		Convey("When I query health", func() {
			ctx := context.Background()
			conn := test.NewGRPCClient(
				ctx,
				lifecycle,
				logger,
				cfg,
				test.NewTracerConfig(),
				nil,
				meter,
			)
			defer conn.Close()

			client := grpc_health_v1.NewHealthClient(conn)
			req := &grpc_health_v1.HealthCheckRequest{}

			watcher, err := client.Watch(ctx, req)
			So(err, ShouldBeNil)

			resp, err := watcher.Recv()
			So(err, ShouldBeNil)

			lifecycle.RequireStop()

			Convey("Then I should have a healthy response", func() {
				So(
					resp.GetStatus(),
					ShouldEqual,
					grpc_health_v1.HealthCheckResponse_SERVING,
				)
			})
		})
	})
}

func observer(
	lc fx.Lifecycle,
	url string,
	client *http.Client,
) *subscriber.Observer {
	cc := checker.NewHTTPChecker(url, client)
	hr := server.NewRegistration("http", 10*time.Millisecond, cc)
	regs := health_registrations.Registrations{hr}
	hs := health.NewServer(lc, regs)

	return hs.Observe("http")
}
