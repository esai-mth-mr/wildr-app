package observer

import "go.uber.org/fx"

var Module = fx.Options(
	fx.Provide(healthObserver),
	fx.Provide(livenessObserver),
	fx.Provide(readinessObserver),
	fx.Provide(grpcObserver),
)
