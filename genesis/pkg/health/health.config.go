package health

import (
	health_registrations "github.com/wildr-inc/app/genesis/pkg/health/registrations"
)

type Config struct {
	Registrations health_registrations.Config `yaml:"registrations" json:"registrations" toml:"registrations"`
}
