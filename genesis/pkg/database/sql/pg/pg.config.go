package pg

import "github.com/wildr-inc/app/genesis/pkg/database/sql/config"

// Config for SQL.
type Config struct {
	config.DriverConfig `yaml:",inline" json:",inline" toml:",inline"`
}
