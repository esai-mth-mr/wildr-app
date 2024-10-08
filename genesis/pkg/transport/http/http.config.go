package http

import (
	"github.com/wildr-inc/app/genesis/pkg/security"
	"github.com/wildr-inc/app/genesis/pkg/transport/http/retry"
)

// Config for HTTP.
type Config struct {
	Security  security.Config `yaml:"security"   json:"security"   toml:"security"`
	Port      string          `yaml:"port"       json:"port"       toml:"port"`
	Retry     retry.Config    `yaml:"retry"      json:"retry"      toml:"retry"`
	UserAgent string          `yaml:"user_agent" json:"user_agent" toml:"user_agent"`
}
