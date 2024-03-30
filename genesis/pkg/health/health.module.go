package health

import (
	health_observer "github.com/wildr-inc/app/genesis/pkg/health/observer"
	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"
	"github.com/wildr-inc/app/genesis/pkg/health/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/health/transport/http"

	"go.uber.org/fx"
)

// Module for fx.
var Module = fx.Options(
	health_registrations.Module,
	health_observer.Module,
	fx.Invoke(http.Register),
	fx.Invoke(grpc.Register),
	fx.Provide(NewServer),
)
