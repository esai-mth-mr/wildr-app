package migrator

import (
	"github.com/wildr-inc/app/genesis/pkg/database/sql/config"
)

type Config struct {
	MasterConfig   config.DSNConnConfig
	DriverName     string `yaml:"driver" json:"driver" toml:"driver"`
	MigrationsPath string `yaml:"path"   json:"path"   toml:"path"`
}
