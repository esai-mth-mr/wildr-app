package authservice

import (
	"io"
	"net/http"

	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/upload-server/pkg/http/client/apiserver"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type AuthServiceParams struct {
	fx.In
	Logger          *zap.Logger
	Config          Config
	ApiServerClient *apiserver.Client
}

type AuthService struct {
	Logger          *zap.Logger
	config          Config
	apiServerClient *http.Client
}

func NewAuthService(params AuthServiceParams) *AuthService {
	logger := params.Logger.Named("auth_service")

	return &AuthService{
		Logger:          logger,
		config:          params.Config,
		apiServerClient: params.ApiServerClient.HTTPClient(),
	}
}

type User struct {
	ID string `json:"id"`
}

type AuthenticateUserWithServerParams struct {
	Request *http.Request
}

func (a *AuthService) AuthenticateUserWithServer(params AuthenticateUserWithServerParams) (bool, *errors.GenesisError) {
	authHeader := params.Request.Header.Get("Authorization")
	originalIP := params.Request.RemoteAddr

	ApiServiceURL := a.config.URI

	a.Logger.Info("received request", zap.String("ip_address", originalIP))

	req, err := http.NewRequest("POST", ApiServiceURL, nil)
	if err != nil {
		a.Logger.Error(
			"failed to create authentication request",
			zap.Error(err),
			zap.String("ip_address", originalIP),
		)

		gError := errors.NewAuthRequestError(errors.AuthRequestErrorParams{
			Error:     "failed to create request",
			DebugData: errors.DebugData{"request": params.Request.Host},
		})

		return false, &gError
	}

	req.Header.Set("Authorization", authHeader)
	req.Header.Set("x-forwarded-for", originalIP)

	resp, err := a.apiServerClient.Do(req)
	if err != nil {
		a.Logger.Error(
			"authentication with API server failed",
			zap.Error(err),
		)

		gError := errors.NewInvalidJWTError(errors.InvalidJWTErrorParams{
			Error:     "authentication with API server failed",
			DebugData: errors.DebugData{"error": err.Error()},
		})

		return false, &gError
	}

	defer closeResponseBody(resp.Body)

	// Check the response status
	if resp.StatusCode != http.StatusOK {
		a.Logger.Error(
			"authentication failed due to bad status code",
			zap.Int("status_code", resp.StatusCode),
		)

		gError := errors.NewInvalidJWTError(errors.InvalidJWTErrorParams{
			Error:     "authentication failed due to bad status code",
			DebugData: errors.DebugData{"status_code": resp.StatusCode},
		})

		return false, &gError
	}

	return true, nil
}

func closeResponseBody(body io.ReadCloser) {
	if body != nil {
		_ = body.Close()
	}
}
