package main

import (
	"os"

	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/migrator"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger"
	"github.com/wildr-inc/app/upload-server/pkg/config"

	"go.uber.org/fx"
)

var CONFIG_FILE string

func main() {
	os.Setenv("CONFIG_FILE", CONFIG_FILE)

	migratorModule := fx.Options(
		cmd.Module,
		config.Module,
		logger.Module,
		migrator.Module,
	)

	fx.New(
		migratorModule,
		fx.Invoke(func(m *migrator.Migrator) {
			err := m.Up()
			if err != nil {
				panic(err)
			}
		}),
	)
}
