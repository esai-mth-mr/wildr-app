package transport

import (
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
)

// Config for transport.
type Config struct {
	GRPC grpc.Config `yaml:"grpc" json:"grpc" toml:"grpc"`
	HTTP http.Config `yaml:"http" json:"http" toml:"http"`
}
