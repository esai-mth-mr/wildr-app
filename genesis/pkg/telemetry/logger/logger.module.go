package logger

import (
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger/zap"

	"go.uber.org/fx"
)

// Module for fx.
var Module = fx.Options(
	fx.Provide(zap.NewConfig),
	fx.Provide(zap.NewLogger),
)
