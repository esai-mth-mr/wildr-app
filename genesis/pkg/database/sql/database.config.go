package sql

import "github.com/wildr-inc/app/genesis/pkg/database/sql/pg"

// DatabaseConfig for sql.
type DatabaseConfig struct {
	PG pg.Config `yaml:"pg" json:"pg" toml:"pg"`
}
