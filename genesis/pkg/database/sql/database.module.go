package sql

import (
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/telemetry/metrics"

	"go.uber.org/fx"
)

// PostgreSQLModule for fx.
var PostgreSQLModule = fx.Options(
	fx.Provide(pg.Open),
	fx.Invoke(pg.Register),
	fx.Invoke(metrics.Register),
	fx.Provide(tracer.NewTracer),
)
