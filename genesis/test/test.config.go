package test

import (
	"path/filepath"
	"runtime"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/cache/redis"
	"github.com/wildr-inc/app/genesis/pkg/cache/ristretto"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/config"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/debug"
	"github.com/wildr-inc/app/genesis/pkg/marshaller"
	"github.com/wildr-inc/app/genesis/pkg/security"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	gretry "github.com/wildr-inc/app/genesis/pkg/transport/grpc/retry"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	hretry "github.com/wildr-inc/app/genesis/pkg/transport/http/retry"
)

const timeout = 2 * time.Second

// Config for test.
type Config struct{}

func (cfg *Config) RedisConfig() *redis.Config {
	return nil
}

func (cfg *Config) RistrettoConfig() *ristretto.Config {
	return nil
}

func (cfg *Config) PGConfig() *pg.Config {
	return nil
}

func (cfg *Config) TransportConfig() *transport.Config {
	return nil
}

func (cfg *Config) GRPCConfig() *grpc.Config {
	return nil
}

func (cfg *Config) HTTPConfig() *http.Config {
	return nil
}

// NewInsecureTransportConfig for test.
func NewInsecureTransportConfig() *transport.Config {
	return &transport.Config{
		HTTP: http.Config{
			Port:      Port(),
			UserAgent: "TestHTTP/1.0",
			Retry: hretry.Config{
				Timeout:  timeout,
				Attempts: 1,
			},
		},
		GRPC: grpc.Config{
			Enabled:   true,
			Port:      Port(),
			UserAgent: "TestGRPC/1.0",
			Retry: gretry.Config{
				Timeout:  timeout,
				Attempts: 1,
			},
		},
	}
}

// NewSecureTransportConfig for test.
func NewSecureTransportConfig() *transport.Config {
	_, b, _, _ := runtime.Caller(0) //nolint:dogsled
	dir := filepath.Dir(b)

	s := security.Config{
		Enabled:        true,
		CertFile:       filepath.Join(dir, "certs/cert.pem"),
		KeyFile:        filepath.Join(dir, "certs/key.pem"),
		ClientCertFile: filepath.Join(dir, "certs/client-cert.pem"),
		ClientKeyFile:  filepath.Join(dir, "certs/client-key.pem"),
	}

	return &transport.Config{
		HTTP: http.Config{
			Security:  s,
			Port:      Port(),
			UserAgent: "TestHTTP/1.0",
			Retry: hretry.Config{
				Timeout:  timeout,
				Attempts: 1,
			},
		},
		GRPC: grpc.Config{
			Enabled:   true,
			Security:  s,
			Port:      Port(),
			UserAgent: "TestGRPC/1.0",
			Retry: gretry.Config{
				Timeout:  timeout,
				Attempts: 1,
			},
		},
	}
}

// NewTracerConfig for test.
func NewTracerConfig() *tracer.Config {
	return &tracer.Config{
		Host: "localhost:4318",
	}
}

// NewPGConfig for test.
func NewPGConfig() *pg.Config {
	return &pg.Config{DriverConfig: config.DriverConfig{
		Masters: []config.DSNConnConfig{{
			Host:     "localhost",
			Port:     5432,
			User:     "wildr",
			Password: "wildr",
			DBName:   "genesis_test",
			SSLMode:  "disable",
		}},
		MaxOpenConns:    5,
		MaxIdleConns:    5,
		ConnMaxLifetime: time.Hour,
	}}
}

// NewCmdConfig for test.
func NewCmdConfig(flag string) (*cmd.Config, error) {
	p := marshaller.FactoryParams{
		YAML: marshaller.NewYAML(),
		TOML: marshaller.NewTOML(),
	}

	return cmd.NewConfig(flag, marshaller.NewFactory(p))
}

// NewDebugConfig for test.
func NewDebugConfig() *debug.Config {
	return &debug.Config{
		Port: Port(),
	}
}
