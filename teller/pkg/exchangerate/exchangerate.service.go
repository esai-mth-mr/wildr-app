package exchangerate

import (
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type ExchangeRateServiceParams struct {
	fx.In

	Logger    *zap.Logger
	Validator *validator.Validator
}

type ExchangeRateService struct {
	logger    zap.Logger
	validator *validator.Validator
}

func NewExchangeRateService(params ExchangeRateServiceParams) (*ExchangeRateService, error) {
	logger := params.Logger.Named("exchange_rate_service")
	return &ExchangeRateService{
		logger:    *logger,
		validator: params.Validator,
	}, nil
}

type GetRateParams struct {
	Currency string `validate:"oneof=USD INR WC"`
}

func (s *ExchangeRateService) GetRate(
	params GetRateParams,
) (float64, *errors.GenesisError) {
	s.logger.Info("retrieving exchange rate")

	if err := s.validator.Validate(params); err != nil {
		s.logger.Error(
			"failed to validate params, bad currency, must be (USD, INR, WC)",
			zap.Error(err),
			zap.String("method", "GetRate"),
		)
		err := NewBadCurrencyError(BadCurrencyErrorParams{
			DebugData: errors.DebugData{"currency": params.Currency},
		})
		return float64(0), &err
	}

	return float64(1), nil
}
