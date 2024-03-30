package model_generator

import (
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(NewModelGenerator),
)
