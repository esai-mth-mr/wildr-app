package walletmarshaller

import (
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"google.golang.org/grpc/codes"
)

type WalletMarshalErrorParams struct {
	Error     string
	DebugData errors.DebugData
}

func NewWalletMarshalError(
	params WalletMarshalErrorParams,
) errors.GenesisError {
	err := "failed to marshal wallet"
	if params.Error != "" {
		err = params.Error
	}

	return errors.GenesisError{
		Err:       err,
		ErrorType: errortypes.WalletMarshalError,
		ErrorCode: codes.Internal,
		Data:      params.DebugData,
	}
}

type WalletUnmarshalErrorParams struct {
	Error     string
	DebugData errors.DebugData
}

func NewWalletUnmarshalError(
	params WalletUnmarshalErrorParams,
) errors.GenesisError {
	err := "failed to unmarshal wallet"
	if params.Error != "" {
		err = params.Error
	}

	return errors.GenesisError{
		Err:       err,
		ErrorType: errortypes.WalletUnmarshalError,
		ErrorCode: codes.Internal,
		Data:      params.DebugData,
	}
}
