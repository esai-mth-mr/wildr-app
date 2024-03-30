package main

import (
	"fmt"
	"os"

	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/config"
	"github.com/wildr-inc/app/genesis/pkg/debug"
	"github.com/wildr-inc/app/genesis/pkg/health"

	"github.com/wildr-inc/app/genesis/pkg/runtime"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"

	"go.uber.org/fx"
)

func main() {
	os.Setenv("CONFIG_FILE", "./genesis/config/config.yml")
	path, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println(path)

	c := cmd.New("0.0.0")
	transportModule := fx.Options(
		transport.Module,
		fx.Provide(grpc.UnaryServerInterceptor),
		fx.Provide(grpc.StreamServerInterceptor),
		fx.Provide(http.ServerHandlers),
	)

	c.AddServer(
		fx.Options(
			runtime.Module,
			config.Module,
			cmd.Module,
			metrics.Module,
			debug.Module,
			health.Module,
			logger.Module,
			transportModule,
		),
	)

	err = c.RunWithArgs([]string{"server"})
	if err != nil {
		panic(err)
	}
}
