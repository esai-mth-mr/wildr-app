package compressor

import (
	"github.com/wildr-inc/app/genesis/pkg/compressor"
)

// NewSnappy for cache.
func NewSnappy() Compressor {
	return compressor.NewSnappy()
}
