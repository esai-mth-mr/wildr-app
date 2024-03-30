package cache

import (
	"github.com/wildr-inc/app/genesis/pkg/cache/redis"
	"github.com/wildr-inc/app/genesis/pkg/cache/ristretto"
)

// Config for cache.
type Config struct {
	Redis     redis.Config     `yaml:"redis"     json:"redis"     toml:"redis"`
	Ristretto ristretto.Config `yaml:"ristretto" json:"ristretto" toml:"ristretto"`
}
