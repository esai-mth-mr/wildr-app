package migrator

import (
	"database/sql"
	"errors"

	"github.com/wildr-inc/app/genesis/pkg/database/sql/driver"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Migrator struct {
	config *Config
	logger *zap.Logger
}

type MigratorParams struct {
	fx.In

	Config *Config
	Logger *zap.Logger
}

func NewMigrator(params MigratorParams) *Migrator {
	return &Migrator{
		config: params.Config,
		logger: params.Logger,
	}
}

func (m *Migrator) Up() error {
	migrator, err := m.getMigrator()
	if err != nil {
		return err
	}

	m.logger.Info("running migrations")
	err = migrator.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			m.logger.Info("no migrations to run")
			return nil
		}
		return err
	}

	m.logger.Info("migrations complete")
	return nil
}

func (m *Migrator) Down() error {
	migrator, err := m.getMigrator()
	if err != nil {
		return err
	}

	m.logger.Info("reverting migrations")
	return migrator.Down()
}

func (m *Migrator) Drop() error {
	migrator, err := m.getMigrator()
	if err != nil {
		return err
	}

	m.logger.Info("dropping database")
	return migrator.Drop()
}

func (m *Migrator) getMigrator() (*migrate.Migrate, error) {
	dsn := driver.ConfigToDSN(m.config.MasterConfig)
	m.logger.Info("opening db conn " + dsn)
	db, err := sql.Open(m.config.DriverName, dsn)
	if err != nil {
		return nil, err
	}

	m.logger.Info("creating migrator")
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return nil, err
	}

	return migrate.NewWithDatabaseInstance(
		m.config.MigrationsPath,
		m.config.DriverName,
		driver,
	)
}
