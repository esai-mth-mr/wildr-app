package ristretto

import (
	"context"

	"github.com/wildr-inc/app/genesis/pkg/version"

	"github.com/dgraph-io/ristretto"
	"go.uber.org/fx"
)

// CacheParams for ristretto.
type CacheParams struct {
	fx.In

	Lifecycle fx.Lifecycle
	Config    *Config
	Version   version.Version
}

// NewCache for ristretto.
func NewCache(params CacheParams) (*ristretto.Cache, error) {
	ristrettoConfig := &ristretto.Config{
		NumCounters: params.Config.NumCounters,
		MaxCost:     params.Config.MaxCost,
		BufferItems: params.Config.BufferItems,
		Metrics:     true,
	}

	cache, err := ristretto.NewCache(ristrettoConfig)
	if err != nil {
		return nil, err
	}

	params.Lifecycle.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			cache.Close()

			return nil
		},
	})

	return cache, nil
}
