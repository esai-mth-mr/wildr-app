package client

import (
	"github.com/wildr-inc/app/upload-server/pkg/http/client/apiserver"
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(apiserver.NewClient),
)
