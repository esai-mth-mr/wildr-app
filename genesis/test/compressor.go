package test

import (
	"github.com/wildr-inc/app/genesis/pkg/compressor"
)

// NewCompressor for test.
func NewCompressor(err error) compressor.Compressor {
	return &cmp{err: err}
}

type cmp struct {
	err error
}

func (c *cmp) Compress(_ []byte) []byte {
	return nil
}

func (c *cmp) Decompress(_ []byte) ([]byte, error) {
	return nil, c.err
}
