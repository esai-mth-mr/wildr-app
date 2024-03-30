package model_generator

import (
	"github.com/wildr-inc/app/genesis/pkg/database/sql/config"
)

type Config struct {
	MasterConfig config.DSNConnConfig
	ModelsPath   string `yaml:"models_path" json:"models_path" toml:"models_path"`
}
