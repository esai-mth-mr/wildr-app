package telemetry

import (
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"

	"go.uber.org/fx"
)

// Module for fx.
var Module = fx.Options(
	logger.Module,
	tracer.Module,
)
