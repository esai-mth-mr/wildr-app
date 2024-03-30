package errortypes

type ErrorType int32

const (
	// Errors starting with 4 are client errors.
	NotFoundError       ErrorType = 4000
	BadCurrencyError    ErrorType = 4001
	WalletNotFoundError ErrorType = 4002
	InvalidJWT          ErrorType = 4003
	// Errors starding with 5 are server errors.
	ValidationError            ErrorType = 5000
	MarshallingError           ErrorType = 5001
	WalletMarshalError         ErrorType = 5002
	WalletUnmarshalError       ErrorType = 5003
	QueryError                 ErrorType = 5004
	AuthRequestError           ErrorType = 5005
	UpdateUploadReferenceError ErrorType = 5008
	UploadNotCompleteError     ErrorType = 5009
)
