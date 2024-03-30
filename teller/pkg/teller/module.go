package teller

import (
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(NewTellerService),
	fx.Invoke(Register),
)
