package config

import (
	"github.com/wildr-inc/app/genesis/pkg/cache"
	"github.com/wildr-inc/app/genesis/pkg/cache/redis"
	"github.com/wildr-inc/app/genesis/pkg/cache/ristretto"
	"github.com/wildr-inc/app/genesis/pkg/database/sql"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/migrator"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/model_generator"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/debug"
	"github.com/wildr-inc/app/genesis/pkg/env"
	"github.com/wildr-inc/app/genesis/pkg/health"
	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"
	"github.com/wildr-inc/app/genesis/pkg/security/token"
	"github.com/wildr-inc/app/genesis/pkg/telemetry"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger/zap"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	"github.com/wildr-inc/app/genesis/pkg/version"
)

// Config for the service.
type Config struct {
	Version        version.Version        `yaml:"version"         json:"version"         toml:"version"`
	Environment    env.Environment        `yaml:"environment"     json:"environment"     toml:"environment"`
	Debug          debug.Config           `yaml:"debug"           json:"debug"           toml:"debug"`
	Cache          cache.Config           `yaml:"cache"           json:"cache"           toml:"cache"`
	SQL            sql.DatabaseConfig     `yaml:"sql"             json:"sql"             toml:"sql"`
	Telemetry      telemetry.Config       `yaml:"telemetry"       json:"telemetry"       toml:"telemetry"`
	Token          token.Config           `yaml:"token"           json:"token"           toml:"token"`
	Transport      transport.Config       `yaml:"transport"       json:"transport"       toml:"transport"`
	Migrator       migrator.Config        `yaml:"migrator"        json:"migrator"        toml:"migrator"`
	Health         health.Config          `yaml:"health"          json:"health"          toml:"health"`
	ModelGenerator model_generator.Config `yaml:"model_generator" json:"model_generator" toml:"model_generator"`
}

func (cfg *Config) VersionConfig() version.Version {
	return cfg.Version
}

func (cfg *Config) EnvironmentConfig() env.Environment {
	return cfg.Environment
}

func (cfg *Config) DebugConfig() *debug.Config {
	return &cfg.Debug
}

func (cfg *Config) RedisConfig() *redis.Config {
	return &cfg.Cache.Redis
}

func (cfg *Config) RistrettoConfig() *ristretto.Config {
	return &cfg.Cache.Ristretto
}

func (cfg *Config) PGConfig() *pg.Config {
	return &cfg.SQL.PG
}

func (cfg *Config) TracerConfig() *tracer.Config {
	return &cfg.Telemetry.Tracer
}

func (cfg *Config) LoggerConfig() *zap.Config {
	return &cfg.Telemetry.Logger
}

func (cfg *Config) TransportConfig() *transport.Config {
	return &cfg.Transport
}

func (cfg *Config) TokenConfig() *token.Config {
	return &cfg.Token
}

func (cfg *Config) GRPCConfig() *grpc.Config {
	return &cfg.Transport.GRPC
}

func (cfg *Config) HTTPConfig() *http.Config {
	return &cfg.Transport.HTTP
}

func (cfg *Config) MigratorConfig() *migrator.Config {
	return &cfg.Migrator
}

func (cfg *Config) HealthConfig() *health.Config {
	return &cfg.Health
}

func (cfg *Config) RegistrationsConfig() *health_registrations.Config {
	return &cfg.Health.Registrations
}

func (cfg *Config) ModelGeneratorConfig() *model_generator.Config {
	return &cfg.ModelGenerator
}
