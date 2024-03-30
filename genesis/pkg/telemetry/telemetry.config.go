package telemetry

import (
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger/zap"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
)

// Config for telemetry.
type Config struct {
	Logger zap.Config    `yaml:"logger" json:"logger" toml:"logger"`
	Tracer tracer.Config `yaml:"tracer" json:"tracer" toml:"tracer"`
}
