package redis

import (
	"github.com/wildr-inc/app/genesis/pkg/version"

	"github.com/go-redis/cache/v8"
	"go.uber.org/fx"
)

// CacheParams for redis.
type CacheParams struct {
	fx.In

	Lifecycle fx.Lifecycle
	Config    *Config
	Options   *cache.Options
	Version   version.Version
}

// NewCache from config.
// The cache is based on https://github.com/go-redis/cache
func NewCache(params CacheParams) *cache.Cache {
	cache := cache.New(params.Options)

	return cache
}
