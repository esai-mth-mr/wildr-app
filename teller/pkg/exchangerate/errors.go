package exchangerate

import (
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"google.golang.org/grpc/codes"
)

type BadCurrencyErrorParams struct {
	DebugData errors.DebugData
}

func NewBadCurrencyError(
	params BadCurrencyErrorParams,
) errors.GenesisError {
	return errors.GenesisError{
		Err:       "invalid currency",
		ErrorType: errortypes.BadCurrencyError,
		ErrorCode: codes.InvalidArgument,
		Data:      params.DebugData,
	}
}
