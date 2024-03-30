package errors

import (
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"google.golang.org/grpc/codes"
)

type Error interface {
	Error() string
	Type() errortypes.ErrorType
	Code() codes.Code
	DebugData() interface{}
}

type GenesisError struct {
	Err       string
	ErrorType errortypes.ErrorType
	ErrorCode codes.Code
	Data      DebugData
}

func (e *GenesisError) Error() string {
	return e.Err
}

func (e *GenesisError) Type() errortypes.ErrorType {
	return e.ErrorType
}

func (e *GenesisError) Code() codes.Code {
	return e.ErrorCode
}

func (e *GenesisError) DebugData() interface{} {
	return e.Data
}

type DebugData map[string]interface{}

type NewGErrorParams struct {
	Error     string
	Type      errortypes.ErrorType
	Code      codes.Code
	DebugData DebugData
}

func NewGError(params NewGErrorParams) GenesisError {
	return GenesisError{
		Err:       params.Error,
		ErrorType: params.Type,
		ErrorCode: params.Code,
		Data:      params.DebugData,
	}
}

type MarshallingErrorParams struct {
	Error     string
	DebugData DebugData
}

func NewMarshallingError(
	params MarshallingErrorParams,
) GenesisError {
	return GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.MarshallingError,
		ErrorCode: codes.Internal,
		Data:      params.DebugData,
	}
}

type ValidationErrorParams struct {
	Error     string
	DebugData DebugData
}

func NewValidationError(
	params ValidationErrorParams,
) GenesisError {
	return GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.ValidationError,
		ErrorCode: codes.InvalidArgument,
		Data:      params.DebugData,
	}
}

type QueryErrorParams struct {
	Error     string
	DebugData DebugData
}

func NewQueryError(
	params QueryErrorParams,
) GenesisError {
	return GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.QueryError,
		ErrorCode: codes.Internal,
		Data:      params.DebugData,
	}
}

type AuthRequestErrorParams struct {
	Error     string
	DebugData DebugData
}

func NewAuthRequestError(params AuthRequestErrorParams) GenesisError {
	return GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.AuthRequestError,
		ErrorCode: codes.InvalidArgument,
		Data:      params.DebugData,
	}
}

type InvalidJWTErrorParams struct {
	Error     string
	DebugData DebugData
}

func NewInvalidJWTError(params InvalidJWTErrorParams) GenesisError {
	return GenesisError{
		Err:       params.Error,
		ErrorType: errortypes.InvalidJWT,
		ErrorCode: codes.InvalidArgument,
		Data:      params.DebugData,
	}
}
