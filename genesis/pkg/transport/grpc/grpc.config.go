package grpc

import (
	"github.com/wildr-inc/app/genesis/pkg/security"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc/retry"
)

// Config for gRPC.
type Config struct {
	Enabled   bool            `yaml:"enabled"    json:"enabled"    toml:"enabled"`
	Security  security.Config `yaml:"security"   json:"security"   toml:"security"`
	Port      string          `yaml:"port"       json:"port"       toml:"port"`
	Retry     retry.Config    `yaml:"retry"      json:"retry"      toml:"retry"`
	UserAgent string          `yaml:"user_agent" json:"user_agent" toml:"user_agent"`
}
