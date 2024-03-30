package pg_test

import (
	"context"
	"testing"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/database/sql/config"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/migrator"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	ptracer "github.com/wildr-inc/app/genesis/pkg/database/sql/pg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/meta"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/test"

	. "github.com/smartystreets/goconvey/convey" //nolint:revive
	"go.uber.org/fx/fxtest"
	"go.uber.org/multierr"
)

func init() {
	tracer.Register()
}

func TestSQL(t *testing.T) {
	Convey("Given I have a configuration", t, func() {
		Convey("When I try to get a database", func() {
			lc := fxtest.NewLifecycle(t)
			logger := test.NewLogger(lc)

			tracer, err := ptracer.NewTracer(
				ptracer.Params{
					Lifecycle: lc,
					Config:    test.NewTracerConfig(),
					Version:   test.Version,
				},
			)
			So(err, ShouldBeNil)

			pg.Register(tracer, logger)

			db, err := pg.Open(
				pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
			)
			So(err, ShouldBeNil)
			So(db, ShouldNotBeNil)

			lc.RequireStart()

			Convey("Then I should have a valid database", func() {
				So(multierr.Combine(db.Ping()...), ShouldBeNil)
			})

			lc.RequireStop()
		})
	})
}

func TestDBQuery(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lifecycle)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})

		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lifecycle,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lifecycle, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lifecycle.RequireStart()

		Convey("When I select data with a query", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			// nolint:rowserrcheck
			rows, err := db.QueryContext(
				ctx,
				"SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
			)

			Convey("Then I should have valid data", func() {
				So(err, ShouldBeNil)

				count := 0

				for rows.Next() {
					count++
				}

				So(count, ShouldBeGreaterThan, 0)
				So(rows.Err(), ShouldBeNil)
				So(rows.Close(), ShouldBeNil)
			})
		})

		lifecycle.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestDBExec(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations/",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I insert data into a table", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			result, err := db.ExecContext(
				ctx,
				"INSERT INTO accounts(created_at) VALUES($1)",
				time.Now(),
			)
			So(err, ShouldBeNil)

			Convey("Then I should have successfully inserted data", func() {
				_, err := result.LastInsertId()
				So(err, ShouldBeError)

				num, err := result.RowsAffected()
				So(err, ShouldBeNil)
				So(num, ShouldBeGreaterThan, 0)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestDBCommitTransExec(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I insert data into a table", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			tx, err := db.BeginTx(ctx, nil)
			So(err, ShouldBeNil)

			defer tx.Rollback() //nolint:errcheck

			result, err := tx.ExecContext(
				ctx,
				"INSERT INTO accounts(created_at) VALUES($1)",
				time.Now(),
			)
			So(err, ShouldBeNil)

			err = tx.Commit()
			So(err, ShouldBeNil)

			Convey("Then I should have successfully inserted data", func() {
				_, err := result.LastInsertId()
				So(err, ShouldBeError)

				num, err := result.RowsAffected()
				So(err, ShouldBeNil)
				So(num, ShouldBeGreaterThan, 0)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestDBRollbackTransExec(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I insert data into a table", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			tx, err := db.BeginTx(ctx, nil)
			So(err, ShouldBeNil)

			result, err := tx.ExecContext(
				ctx,
				"INSERT INTO accounts(created_at) VALUES($1)",
				time.Now(),
			)
			So(err, ShouldBeNil)

			err = tx.Rollback()
			So(err, ShouldBeNil)

			Convey("Then I should have successfully inserted data", func() {
				_, err := result.LastInsertId()
				So(err, ShouldBeError)

				num, err := result.RowsAffected()
				So(err, ShouldBeNil)
				So(num, ShouldBeGreaterThan, 0)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestStatementQuery(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I select data with a query", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			_, stmt, err := db.PrepareContext(
				ctx,
				"SELECT table_name FROM information_schema.tables WHERE table_schema = $1",
			)
			So(err, ShouldBeNil)

			defer stmt.Close()

			// nolint:rowserrcheck,execinquery
			rows, err := stmt.QueryContext(ctx, "public")

			Convey("Then I should have valid data", func() {
				So(err, ShouldBeNil)

				count := 0

				for rows.Next() {
					count++
				}

				So(count, ShouldBeGreaterThan, 0)
				So(rows.Err(), ShouldBeNil)
				So(rows.Close(), ShouldBeNil)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestStatementExec(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I insert data into a table", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			_, stmt, err := db.PrepareContext(
				ctx,
				"INSERT INTO accounts(created_at) VALUES($1)",
			)
			So(err, ShouldBeNil)

			defer stmt.Close()

			result, err := stmt.ExecContext(ctx, time.Now())
			So(err, ShouldBeNil)

			Convey("Then I should have successfully inserted data", func() {
				_, err := result.LastInsertId()
				So(err, ShouldBeError)

				num, err := result.RowsAffected()
				So(err, ShouldBeNil)
				So(num, ShouldBeGreaterThan, 0)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestTransStatementExec(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I insert data into a table", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			tx, err := db.Begin()
			So(err, ShouldBeNil)

			defer tx.Rollback() // nolint:errcheck

			stmt, err := tx.PrepareContext(
				ctx,
				"INSERT INTO accounts(created_at) VALUES($1)",
			)
			So(err, ShouldBeNil)

			defer stmt.Close()

			result, err := stmt.ExecContext(ctx, time.Now())
			So(err, ShouldBeNil)

			err = tx.Commit()
			So(err, ShouldBeNil)

			Convey("Then I should have successfully inserted data", func() {
				_, err := result.LastInsertId()
				So(err, ShouldBeError)

				num, err := result.RowsAffected()
				So(err, ShouldBeNil)
				So(num, ShouldBeGreaterThan, 0)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestInvalidStatementQuery(t *testing.T) {
	Convey("Given I have a ready database", t, func() {
		lc := fxtest.NewLifecycle(t)
		logger := test.NewLogger(lc)

		m := migrator.NewMigrator(migrator.MigratorParams{
			Config: &migrator.Config{
				MasterConfig: config.DSNConnConfig{
					Host:     "localhost",
					Port:     5432,
					User:     "wildr",
					Password: "wildr",
					DBName:   "genesis_test",
					SSLMode:  "disable",
				},
				DriverName:     "postgres",
				MigrationsPath: "file://./testdata/migrations",
			},
			Logger: logger,
		})
		err := m.Up()
		So(err, ShouldBeNil)

		tracer, err := ptracer.NewTracer(
			ptracer.Params{
				Lifecycle: lc,
				Config:    test.NewTracerConfig(),
				Version:   test.Version,
			},
		)
		So(err, ShouldBeNil)

		pg.Register(tracer, logger)

		db, err := pg.Open(
			pg.OpenParams{Lifecycle: lc, Config: test.NewPGConfig()},
		)
		So(err, ShouldBeNil)

		lc.RequireStart()

		Convey("When I select data with an invalid query", func() {
			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			ctx = meta.WithAttribute(ctx, "test", "test")

			_, stmt, err := db.PrepareContext(
				ctx,
				"SELECT table_name FROM information_schema.tables WHERE table_schema = $1",
			)
			So(err, ShouldBeNil)

			defer stmt.Close()

			//nolint:sqlclosecheck,rowserrcheck,execinquery
			_, err = stmt.QueryContext(ctx, 1)

			Convey("Then I should have an error", func() {
				So(err, ShouldBeError)
			})
		})

		lc.RequireStop()

		err = m.Drop()
		So(err, ShouldBeNil)
	})
}

func TestInvalidSQLPort(t *testing.T) {
	Convey("Given I have a configuration", t, func() {
		cfg := &pg.Config{DriverConfig: config.DriverConfig{
			Masters: []config.DSNConnConfig{{
				Host:     "localhost",
				Port:     5444,
				User:     "test",
				DBName:   "test",
				SSLMode:  "disable",
				Password: "test",
			}},
			MaxOpenConns:    5,
			MaxIdleConns:    5,
			ConnMaxLifetime: time.Hour,
		}}

		Convey("When I try to get a database", func() {
			lc := fxtest.NewLifecycle(t)
			logger := test.NewLogger(lc)

			tracer, err := ptracer.NewTracer(
				ptracer.Params{
					Lifecycle: lc,
					Config:    test.NewTracerConfig(),
					Version:   test.Version,
				},
			)
			So(err, ShouldBeNil)

			pg.Register(tracer, logger)

			db, err := pg.Open(pg.OpenParams{Lifecycle: lc, Config: cfg})
			So(err, ShouldBeNil)

			lc.RequireStart()

			Convey("Then I should have an invalid database", func() {
				So(multierr.Combine(db.Ping()...), ShouldBeError)
			})

			lc.RequireStop()
		})
	})
}
