package main

import (
	"os"

	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/model_generator"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger"
	"github.com/wildr-inc/app/upload-server/pkg/config"

	"go.uber.org/fx"
)

func main() {
	os.Setenv("CONFIG_FILE", "./config/config.yml")

	generatorModule := fx.Options(
		cmd.Module,
		config.Module,
		logger.Module,
		model_generator.Module,
	)
	fx.New(
		generatorModule,
		fx.Invoke(func(generator *model_generator.ModelGenerator) {
			err := generator.Generate()
			if err != nil {
				panic(err)
			}
		}),
	)
}
