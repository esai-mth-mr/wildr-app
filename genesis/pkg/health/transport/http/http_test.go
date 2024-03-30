package http_test

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/health"
	health_checker "github.com/wildr-inc/app/genesis/pkg/health/checker"
	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"
	health_http "github.com/wildr-inc/app/genesis/pkg/health/transport/http"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/test"

	"github.com/alexfalkowski/go-health/checker"
	"github.com/alexfalkowski/go-health/server"
	. "github.com/smartystreets/goconvey/convey" //nolint:revive
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"go.uber.org/zap"
)

func init() {
	tracer.Register()
}

func TestHealth(t *testing.T) {
	checks := []string{"healthz", "livez", "readyz"}

	for _, check := range checks {
		Convey("Given I register the health handler", t, func() {
			fxLifecycle := fxtest.NewLifecycle(t)
			logger := test.NewLogger(fxLifecycle)
			cfg := test.NewInsecureTransportConfig()

			meter, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
			So(err, ShouldBeNil)

			test.StatusServer(
				test.StatusServerParams{Lifecycle: fxLifecycle, Port: "6000"},
			)

			observer := observer(
				fxLifecycle,
				"http://localhost:6000/v1/status/200",
				test.NewHTTPClient(fxLifecycle, logger, test.NewTracerConfig(), cfg, meter),
				logger,
			).Observe("http")
			httpServer := test.NewHTTPServer(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				meter,
				nil,
			)
			grpcServer := test.NewGRPCServer(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				false,
				meter,
				nil,
				nil,
			)

			test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)

			params := health_http.RegisterParams{
				Server:        httpServer,
				HttpHealth:    &health_http.HttpHealthObserver{Observer: observer},
				HttpLiveness:  &health_http.HttpLivenessObserver{Observer: observer},
				HttpReadiness: &health_http.HttpReadinessObserver{Observer: observer},
				Version:       test.Version,
			}
			err = health_http.Register(params)
			So(err, ShouldBeNil)

			fxLifecycle.RequireStart()

			Convey(fmt.Sprintf("When I query %s", check), func() {
				client := test.NewHTTPClient(
					fxLifecycle,
					logger,
					test.NewTracerConfig(),
					cfg,
					meter,
				)

				req, err := http.NewRequestWithContext(
					context.Background(),
					"GET",
					fmt.Sprintf("http://localhost:%s/%s", cfg.HTTP.Port, check),
					nil,
				)
				So(err, ShouldBeNil)

				resp, err := client.Do(req)
				So(err, ShouldBeNil)

				defer resp.Body.Close()

				body, err := io.ReadAll(resp.Body)
				So(err, ShouldBeNil)

				actual := strings.TrimSpace(string(body))

				fxLifecycle.RequireStop()

				Convey("Then I should have a healthy response", func() {
					So(actual, ShouldEqual, `{"status":"SERVING"}`)
					So(
						resp.Header.Get("Version"),
						ShouldEqual,
						string(test.Version),
					)
				})
			})
		})
	}
}

func TestReadinessNoop(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: fxLifecycle, Port: "6000"},
		)

		server := observer(
			fxLifecycle,
			"http://localhost:6000/v1/status/500",
			test.NewHTTPClient(fxLifecycle, logger, test.NewTracerConfig(), cfg, meter),
			logger,
		)
		observer := server.Observe("http")
		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			nil,
			nil,
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)

		params := health_http.RegisterParams{
			Server:        httpServer,
			HttpHealth:    &health_http.HttpHealthObserver{Observer: observer},
			HttpLiveness:  &health_http.HttpLivenessObserver{Observer: observer},
			HttpReadiness: &health_http.HttpReadinessObserver{Observer: server.Observe("noop")},
			Version:       test.Version,
		}
		err = health_http.Register(params)
		So(err, ShouldBeNil)

		fxLifecycle.RequireStart()

		Convey("When I query health", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				meter,
			)

			req, err := http.NewRequestWithContext(
				context.Background(),
				"GET",
				fmt.Sprintf("http://localhost:%s/readyz", cfg.HTTP.Port),
				nil,
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			fxLifecycle.RequireStop()

			Convey("Then I should have a healthy response", func() {
				So(actual, ShouldEqual, `{"status":"SERVING"}`)
				So(
					resp.Header.Get("Version"),
					ShouldEqual,
					string(test.Version),
				)
			})
		})
	})
}

func TestInvalidHealth(t *testing.T) {
	Convey("Given I register the health handler", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		cfg := test.NewInsecureTransportConfig()

		meter, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		test.StatusServer(
			test.StatusServerParams{Lifecycle: fxLifecycle, Port: "6000"},
		)

		observer := observer(
			fxLifecycle,
			"http://localhost:6000/v1/status/500",
			test.NewHTTPClient(fxLifecycle, logger, test.NewTracerConfig(), cfg, meter),
			logger,
		).Observe("http")
		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			meter,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			meter,
			nil,
			nil,
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)

		params := health_http.RegisterParams{
			Server: httpServer, HttpHealth: &health_http.HttpHealthObserver{Observer: observer},
			HttpLiveness: &health_http.HttpLivenessObserver{
				Observer: observer,
			}, HttpReadiness: &health_http.HttpReadinessObserver{Observer: observer},
			Version: test.Version,
		}
		err = health_http.Register(params)
		So(err, ShouldBeNil)

		fxLifecycle.RequireStart()

		Convey("When I query health", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				meter,
			)

			req, err := http.NewRequestWithContext(
				context.Background(),
				"GET",
				fmt.Sprintf("http://localhost:%s/healthz", cfg.HTTP.Port),
				nil,
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			fxLifecycle.RequireStop()

			Convey("Then I should have an unhealthy response", func() {
				So(
					actual,
					ShouldEqual,
					`{"errors":{"http":"invalid status code"},"status":"NOT_SERVING"}`,
				)
				So(
					resp.Header.Get("Version"),
					ShouldEqual,
					string(test.Version),
				)
			})
		})
	})
}

func observer(
	lc fx.Lifecycle,
	url string,
	client *http.Client,
	logger *zap.Logger,
) *server.Server {
	redisClient := test.NewRedisClient(lc, "localhost:6379", logger)
	redisChecker := health_checker.NewRedisChecker(redisClient, 1*time.Second)
	redisRegistration := server.NewRegistration("redis", 10*time.Millisecond, redisChecker)

	clientChecker := checker.NewHTTPChecker(url, client)
	clientRegistration := server.NewRegistration("http", 10*time.Millisecond, clientChecker)

	noopChecker := checker.NewNoopChecker()
	noopRegistration := server.NewRegistration("noop", 10*time.Millisecond, noopChecker)

	regs := health_registrations.Registrations{
		noopRegistration,
		redisRegistration,
		clientRegistration,
	}

	return health.NewServer(lc, regs)
}
