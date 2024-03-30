package client

import (
	"github.com/wildr-inc/app/upload-server/pkg/http/client/apiserver"
)

type Config struct {
	ApiServer apiserver.Config `yaml:"external_services.api_server" json:"external_services.api_server" toml:"external_services.api_server"`
}
