package uploadstateservice

import (
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"google.golang.org/grpc/codes"
)

type UpdateUploadReferenceErrorParams struct {
	Error     string
	DebugData errors.DebugData
}

func NewUpdateUploadReferencedError(params UpdateUploadReferenceErrorParams) errors.GenesisError {
	return errors.GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.UpdateUploadReferenceError,
		ErrorCode: codes.InvalidArgument,
		Data:      params.DebugData,
	}
}

type UploadNotCompleteErrorParams struct {
	Error     string
	DebugData errors.DebugData
}

func UploadNotCompleteError(params UploadNotCompleteErrorParams) errors.GenesisError {
	return errors.GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.UploadNotCompleteError,
		ErrorCode: codes.InvalidArgument,
		Data:      params.DebugData,
	}
}
