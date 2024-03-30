package driver

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"

	"github.com/wildr-inc/app/genesis/pkg/database/sql/config"
	driver_zap "github.com/wildr-inc/app/genesis/pkg/database/sql/driver/telemetry/logger/zap"
	sql_tracer "github.com/wildr-inc/app/genesis/pkg/database/sql/driver/telemetry/tracer"

	"github.com/linxGnu/mssqlx"
	"github.com/ngrok/sqlmw"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/fx"
	"go.uber.org/multierr"
	"go.uber.org/zap"
)

// Register the driver for SQL.
func Register(
	name string,
	driver driver.Driver,
	tracer trace.Tracer,
	logger *zap.Logger,
) {
	var interceptor sqlmw.Interceptor = &sqlmw.NullInterceptor{}
	interceptor = sql_tracer.NewInterceptor(name, tracer, interceptor)
	interceptor = driver_zap.NewInterceptor(name, logger, interceptor)

	sql.Register(name, sqlmw.Driver(driver, interceptor))
}

func Open(
	lc fx.Lifecycle,
	name string,
	cfg config.DriverConfig,
) (*mssqlx.DBs, error) {
	masterDSNs := make([]string, len(cfg.Masters))
	for i, mCfg := range cfg.Masters {
		masterDSNs[i] = ConfigToDSN(mCfg)
	}

	slaveDSNs := make([]string, len(cfg.Slaves))
	for i, sCfg := range cfg.Slaves {
		slaveDSNs[i] = ConfigToDSN(sCfg)
	}

	db, err := connect(name, masterDSNs, slaveDSNs)
	if err != nil {
		return nil, err
	}

	lc.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			return destroy(db)
		},
	})

	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetMaxOpenConns(cfg.MaxOpenConns)

	return db, nil
}

func ConfigToDSN(cfg config.DSNConnConfig) string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.DBName,
		cfg.SSLMode,
	)
}

func connect(name string, masterDSNs, slaveDSNs []string) (*mssqlx.DBs, error) {
	db, errs := mssqlx.ConnectMasterSlaves(name, masterDSNs, slaveDSNs)
	return db, multierr.Combine(errs...)
}

func destroy(db *mssqlx.DBs) error {
	return multierr.Combine(db.Destroy()...)
}
