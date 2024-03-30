package walletrepo

import (
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"google.golang.org/grpc/codes"
)

type WalletNotFoundErrorParams struct {
	DebugData errors.DebugData
}

func NewWalletNotFoundError(
	params WalletNotFoundErrorParams,
) errors.GenesisError {
	return errors.GenesisError{
		Err:       "wallet not found",
		ErrorType: errortypes.WalletNotFoundError,
		ErrorCode: codes.NotFound,
		Data:      params.DebugData,
	}
}
