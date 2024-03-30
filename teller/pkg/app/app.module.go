package app

import (
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql"
	"github.com/wildr-inc/app/genesis/pkg/debug"
	"github.com/wildr-inc/app/genesis/pkg/health"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"github.com/wildr-inc/app/teller/pkg/config"
	"github.com/wildr-inc/app/teller/pkg/exchangerate"
	"github.com/wildr-inc/app/teller/pkg/teller"
	"github.com/wildr-inc/app/teller/pkg/wallet"

	"github.com/wildr-inc/app/genesis/pkg/runtime"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/logger"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"

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
	sql.PostgreSQLModule,
	validator.Module,
	wallet.Module,
	teller.Module,
	exchangerate.Module,
)
