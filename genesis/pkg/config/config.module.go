package config

import (
	"github.com/wildr-inc/app/genesis/pkg/marshaller"

	"go.uber.org/fx"
)

var (
	// Module for fx.
	Module = fx.Options(
		ConfiguratorModule,
		ConfigModule,
		marshaller.Module,
	)

	// ConfiguratorModule for fx.
	ConfiguratorModule = fx.Provide(NewConfigurator)

	// ConfigModule for fx.
	ConfigModule = fx.Options(
		fx.Provide(environmentConfig),
		fx.Provide(redisConfig),
		fx.Provide(ristrettoConfig),
		fx.Provide(pgConfig),
		fx.Provide(tokenConfig),
		fx.Provide(loggerConfig),
		fx.Provide(tracerConfig),
		fx.Provide(transportConfig),
		fx.Provide(grpcConfig),
		fx.Provide(httpConfig),
		fx.Provide(debugConfig),
		fx.Provide(versionConfig),
		fx.Provide(migratorConfig),
		fx.Provide(healthConfig),
		fx.Provide(registrationsConfig),
		fx.Provide(modelGeneratorConfig),
	)
)
