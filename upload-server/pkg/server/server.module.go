package server

import (
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/debug"
	"github.com/wildr-inc/app/genesis/pkg/health"
	"github.com/wildr-inc/app/genesis/pkg/marshaller"
	"github.com/wildr-inc/app/upload-server/pkg/auth"
	"github.com/wildr-inc/app/upload-server/pkg/upload"
	"github.com/wildr-inc/app/upload-server/pkg/uploadstate"

	"github.com/wildr-inc/app/genesis/pkg/runtime"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	"github.com/wildr-inc/app/upload-server/pkg/config"
	"github.com/wildr-inc/app/upload-server/pkg/http/client"
	"go.uber.org/fx"
)

var Module = fx.Options(
	transport.Module,
	fx.Provide(grpc.UnaryServerInterceptor),
	fx.Provide(grpc.StreamServerInterceptor),
	fx.Provide(http.ServerHandlers),
	runtime.Module,
	config.Module,
	cmd.Module,
	metrics.Module,
	debug.Module,
	health.Module,
	logger.Module,
	upload.Module,
	client.Module,
	marshaller.Module,
	auth.Module,
	uploadstate.Module,
)
