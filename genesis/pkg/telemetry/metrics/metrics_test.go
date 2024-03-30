package metrics_test

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/wildr-inc/app/genesis/pkg/compressor"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	pg_tracer "github.com/wildr-inc/app/genesis/pkg/database/sql/pg/telemetry/tracer"
	sql_metrics "github.com/wildr-inc/app/genesis/pkg/database/sql/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/marshaller"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/test"

	. "github.com/smartystreets/goconvey/convey" //nolint:revive
	"go.uber.org/fx/fxtest"
)

func init() {
	tracer.Register()
}

//nolint:dupl
func TestInsecureHTTP(t *testing.T) {
	Convey("Given I register the metrics handler", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)

		tracer, err := pg_tracer.NewTracer(
			pg_tracer.Params{
				Lifecycle: fxLifecycle,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		meter, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		dbs, err := pg.Open(
			pg.OpenParams{Lifecycle: fxLifecycle, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		err = sql_metrics.Register(dbs, test.Version, meter)
		So(err, ShouldBeNil)

		_, err = test.NewRedisCache(
			fxLifecycle,
			"localhost:6379",
			logger,
			compressor.NewSnappy(),
			marshaller.NewProto(),
			meter,
		)
		So(err, ShouldBeNil)

		_, err = test.NewRistrettoCache(fxLifecycle, meter)
		So(err, ShouldBeNil)

		cfg := test.NewInsecureTransportConfig()
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

		err = metrics.Register(httpServer)
		So(err, ShouldBeNil)

		fxLifecycle.RequireStart()

		Convey("When I query metrics", func() {
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
				fmt.Sprintf("http://localhost:%s/metrics", cfg.HTTP.Port),
				nil,
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			Convey("Then I should have valid metrics", func() {
				response := string(body)

				So(response, ShouldContainSubstring, "go_info")
				So(response, ShouldContainSubstring, "redis_hits_total")
				So(response, ShouldContainSubstring, "ristretto_hits_total")
				So(response, ShouldContainSubstring, "sql_max_open_total")
			})
		})

		fxLifecycle.RequireStop()
	})
}

//nolint:dupl
func TestSecureHTTP(t *testing.T) {
	t.Skip("TLS Not Yet Needed")
	Convey("Given I register the metrics handler", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)

		tracer, err := pg_tracer.NewTracer(
			pg_tracer.Params{
				Lifecycle: fxLifecycle,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		meter, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		dbs, err := pg.Open(
			pg.OpenParams{Lifecycle: fxLifecycle, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		err = sql_metrics.Register(dbs, test.Version, meter)
		So(err, ShouldBeNil)

		_, err = test.NewRedisCache(
			fxLifecycle,
			"localhost:6379",
			logger,
			compressor.NewSnappy(),
			marshaller.NewProto(),
			meter,
		)
		So(err, ShouldBeNil)

		_, err = test.NewRistrettoCache(fxLifecycle, meter)
		So(err, ShouldBeNil)

		cfg := test.NewSecureTransportConfig()
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

		err = metrics.Register(httpServer)
		So(err, ShouldBeNil)

		fxLifecycle.RequireStart()

		Convey("When I query metrics", func() {
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
				fmt.Sprintf("https://localhost:%s/metrics", cfg.HTTP.Port),
				nil,
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			Convey("Then I should have valid metrics", func() {
				response := string(body)

				So(response, ShouldContainSubstring, "go_info")
				So(response, ShouldContainSubstring, "redis_hits_total")
				So(response, ShouldContainSubstring, "ristretto_hits_total")
				So(response, ShouldContainSubstring, "sql_max_open_total")
			})
		})

		fxLifecycle.RequireStop()
	})
}
