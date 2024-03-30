package pg

import (
	"sync"

	"github.com/wildr-inc/app/genesis/pkg/database/sql/driver"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg/telemetry/tracer"

	_ "github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/linxGnu/mssqlx"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// OpenParams for pg.
type OpenParams struct {
	fx.In

	Lifecycle fx.Lifecycle
	Config    *Config
}

// Open for pg.
func Open(params OpenParams) (*mssqlx.DBs, error) {
	return driver.Open(params.Lifecycle, "pg", params.Config.DriverConfig)
}

var once sync.Once

// Register the driver for pg.
func Register(tracer tracer.Tracer, logger *zap.Logger) {
	once.Do(func() {
		driver.Register("pg", stdlib.GetDefaultDriver(), tracer, logger)
	})
}
