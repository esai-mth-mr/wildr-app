package config

import (
	"github.com/wildr-inc/app/genesis/pkg/cache/redis"
	"github.com/wildr-inc/app/genesis/pkg/cache/ristretto"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/config"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/migrator"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/model_generator"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/debug"
	"github.com/wildr-inc/app/genesis/pkg/env"
	"github.com/wildr-inc/app/genesis/pkg/health"
	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"
	"github.com/wildr-inc/app/genesis/pkg/security/token"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger/zap"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	"github.com/wildr-inc/app/genesis/pkg/version"
	"github.com/wildr-inc/app/upload-server/pkg/auth"
)

// NewConfigurator for config.
func NewConfigurator(i *cmd.InputConfig) (Configurator, error) {
	c := &Config{}

	return c, i.Unmarshal(c)
}

// Configurator for config.
type Configurator interface {
	VersionConfig() version.Version
	EnvironmentConfig() env.Environment
	DebugConfig() *debug.Config
	RedisConfig() *redis.Config
	RistrettoConfig() *ristretto.Config
	PGConfig() *pg.Config
	LoggerConfig() *zap.Config
	TokenConfig() *token.Config
	TracerConfig() *tracer.Config
	TransportConfig() *transport.Config
	GRPCConfig() *grpc.Config
	HTTPConfig() *http.Config
	MigratorConfig() *migrator.Config
	HealthConfig() *health.Config
	RegistrationsConfig() *health_registrations.Config
	ModelGeneratorConfig() *model_generator.Config
	AuthConfig() *auth.Config
}

func versionConfig(cfg Configurator) version.Version {
	return cfg.VersionConfig()
}

func environmentConfig(cfg Configurator) env.Environment {
	return cfg.EnvironmentConfig()
}

func debugConfig(cfg Configurator) *debug.Config {
	return cfg.DebugConfig()
}

func redisConfig(cfg Configurator) *redis.Config {
	return cfg.RedisConfig()
}

func ristrettoConfig(cfg Configurator) *ristretto.Config {
	return cfg.RistrettoConfig()
}

func pgConfig(cfg Configurator) *pg.Config {
	return cfg.PGConfig()
}

func loggerConfig(cfg Configurator) *zap.Config {
	return cfg.LoggerConfig()
}

func tokenConfig(cfg Configurator) *token.Config {
	return cfg.TokenConfig()
}

func tracerConfig(cfg Configurator) *tracer.Config {
	return cfg.TracerConfig()
}

func transportConfig(cfg Configurator) *transport.Config {
	return cfg.TransportConfig()
}

func grpcConfig(cfg Configurator) *grpc.Config {
	return cfg.GRPCConfig()
}

func httpConfig(cfg Configurator) *http.Config {
	return cfg.HTTPConfig()
}

func migratorConfig(cfg Configurator) *migrator.Config {
	masterConfig := cfg.PGConfig().Masters[0]
	return &migrator.Config{
		MasterConfig: config.DSNConnConfig{
			Host:     masterConfig.Host,
			Port:     masterConfig.Port,
			User:     masterConfig.User,
			Password: masterConfig.Password,
			DBName:   masterConfig.DBName,
			SSLMode:  masterConfig.SSLMode,
		},
		MigrationsPath: cfg.MigratorConfig().MigrationsPath,
		DriverName:     cfg.MigratorConfig().DriverName,
	}
}

func healthConfig(cfg Configurator) *health.Config {
	return cfg.HealthConfig()
}

func registrationsConfig(cfg Configurator) *health_registrations.Config {
	return cfg.RegistrationsConfig()
}

func modelGeneratorConfig(cfg Configurator) *model_generator.Config {
	masterConfig := cfg.PGConfig().Masters[0]
	return &model_generator.Config{
		MasterConfig: config.DSNConnConfig{
			Host:     masterConfig.Host,
			Port:     masterConfig.Port,
			User:     masterConfig.User,
			Password: masterConfig.Password,
			DBName:   masterConfig.DBName,
			SSLMode:  masterConfig.SSLMode,
		},
		ModelsPath: cfg.ModelGeneratorConfig().ModelsPath,
	}
}

func authConfig(cfg Configurator) *auth.Config {
	return cfg.AuthConfig()
}
