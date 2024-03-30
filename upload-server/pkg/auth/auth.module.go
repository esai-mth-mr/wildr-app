package auth

import (
	"github.com/wildr-inc/app/upload-server/pkg/auth/authservice"
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(authservice.NewAuthService),
)
