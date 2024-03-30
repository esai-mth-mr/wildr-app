package cmd_test

import (
	"os"
	"testing"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/cache"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/config"
	"github.com/wildr-inc/app/genesis/pkg/database/sql"
	"github.com/wildr-inc/app/genesis/pkg/health"
	"github.com/wildr-inc/app/genesis/pkg/runtime"
	"github.com/wildr-inc/app/genesis/pkg/telemetry"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"

	. "github.com/smartystreets/goconvey/convey" //nolint:revive
	"go.uber.org/fx"
)

func TestShutdown(t *testing.T) {
	Convey("Given I have valid configuration", t, func() {
		os.Setenv("CONFIG_FILE", "./testdata/config.yml")

		Convey(
			"When I try to run an application that will shutdown in 5 seconds",
			func() {
				c := cmd.New("1.0.0")
				c.AddWorker(opts()...)

				Convey("Then I should not see an error", func() {
					So(c.RunWithArgs([]string{"worker"}), ShouldBeNil)
				})

				So(os.Unsetenv("CONFIG_FILE"), ShouldBeNil)
			},
		)
	})
}

func TestRun(t *testing.T) {
	Convey("Given I have valid configuration", t, func() {
		os.Setenv("CONFIG_FILE", "./testdata/config.yml")

		Convey(
			"When I try to run an application that will shutdown in 5 seconds",
			func() {
				c := cmd.New("1.0.0")
				c.AddWorker(opts()...)

				Convey("Then I should not see an error", func() {
					So(c.Run(), ShouldBeNil)
				})

				So(os.Unsetenv("CONFIG_FILE"), ShouldBeNil)
			},
		)
	})
}

func TestInvalid(t *testing.T) {
	Convey("Given I have invalid HTTP port set", t, func() {
		Convey("When I try to run an application", func() {
			c := cmd.New("1.0.0")
			c.AddServer(opts()...)

			Convey("Then I should see an error", func() {
				err := c.RunWithArgs(
					[]string{
						"server",
						"--input",
						"file:./testdata/invalid.config.yml",
					},
				)

				So(err, ShouldBeError)
				So(err.Error(), ShouldEqual, "invalid port")
			})
		})
	})
}

func TestClient(t *testing.T) {
	Convey("Given I have valid configuration", t, func() {
		Convey("When I try to run a client", func() {
			opts := []fx.Option{fx.NopLogger}

			c := cmd.New("1.0.0")
			c.AddClient(opts...)

			Convey("Then I should not see an error", func() {
				So(c.RunWithArgs([]string{"client"}), ShouldBeNil)
			})
		})
	})
}

func TestInvalidClient(t *testing.T) {
	Convey("Given I have invalid HTTP port set", t, func() {
		os.Setenv("CONFIG_FILE", "./testdata/invalid.config.yml")

		Convey("When I try to run an application", func() {
			c := cmd.New("1.0.0")
			c.AddClient(opts()...)

			Convey("Then I should see an error", func() {
				err := c.RunWithArgs(
					[]string{"client", "--input", "env:CONFIG_FILE"},
				)

				So(err, ShouldBeError)
				So(err.Error(), ShouldEqual, "invalid port")
			})

			So(os.Unsetenv("TEST_CONFIG_FILE"), ShouldBeNil)
		})
	})
}

func shutdown(s fx.Shutdowner) {
	go func(s fx.Shutdowner) {
		time.Sleep(time.Second)

		_ = s.Shutdown()
	}(s)
}

func opts() []fx.Option {
	tm := fx.Options(
		transport.Module,
		fx.Provide(grpc.UnaryServerInterceptor),
		fx.Provide(grpc.StreamServerInterceptor),
		fx.Provide(http.ServerHandlers),
	)

	return []fx.Option{
		fx.NopLogger,
		runtime.Module,
		cmd.Module,
		config.Module,
		telemetry.Module,
		metrics.Module,
		health.Module,
		sql.PostgreSQLModule,
		tm,
		cache.RedisModule,
		cache.RistrettoModule,
		cache.ProtoMarshallerModule,
		cache.SnappyCompressorModule,
		fx.Invoke(shutdown),
	}
}
