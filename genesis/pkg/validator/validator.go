package validator

import (
	"github.com/go-playground/validator/v10"
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Validator struct {
	Logger    *zap.Logger
	validator *validator.Validate
}

type ValidatorParams struct {
	fx.In

	Logger *zap.Logger
}

func NewValidator(
	params ValidatorParams,
) *Validator {
	logger := params.Logger.Named("validator")
	return &Validator{
		validator: validator.New(validator.WithRequiredStructEnabled()),
		Logger:    logger,
	}
}

func (v *Validator) Validate(
	i interface{},
) *errors.GenesisError {
	if i == nil {
		valErr := errors.NewValidationError(errors.ValidationErrorParams{
			Error:     "nil interface",
			DebugData: errors.DebugData{},
		})
		return &valErr
	}
	err := v.validator.Struct(i)
	if err != nil {
		v.Logger.Error(
			"validation failed",
			zap.Error(err),
		)
		valErr := errors.NewValidationError(errors.ValidationErrorParams{
			Error: err.Error(),
			DebugData: errors.DebugData{
				"error": err,
			},
		})
		return &valErr
	}

	return nil
}
