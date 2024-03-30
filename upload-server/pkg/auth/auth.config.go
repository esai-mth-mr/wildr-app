package auth

import (
	"github.com/wildr-inc/app/upload-server/pkg/auth/authservice"
)

type Config struct {
	ApiServer authservice.Config `yaml:"external_services.api_server" json:"external_services.api_server" toml:"external_services.api_server"`
}
