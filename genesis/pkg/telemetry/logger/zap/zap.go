package zap

import (
	"context"

	"github.com/wildr-inc/app/genesis/pkg/env"
	"github.com/wildr-inc/app/genesis/pkg/os"
	"github.com/wildr-inc/app/genesis/pkg/version"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

// LoggerParams for zap.
type LoggerParams struct {
	fx.In

	Lifecycle   fx.Lifecycle
	Config      zap.Config
	Environment env.Environment
	Version     version.Version
}

// NewLogger using zap.
func NewLogger(params LoggerParams) (*zap.Logger, error) {
	fields := zap.Fields(
		zap.String("name", os.ExecutableName()),
		zap.String("environment", string(params.Environment)),
		zap.String("version", string(params.Version)),
	)

	logger, err := params.Config.Build(fields)
	if err != nil {
		return nil, err
	}

	params.Lifecycle.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			_ = logger.Sync()

			return nil
		},
	})

	return logger, nil
}
