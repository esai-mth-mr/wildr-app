package test

import (
	redis_metrics "github.com/wildr-inc/app/genesis/pkg/cache/redis/telemetry/metrics"
	g_ristretto "github.com/wildr-inc/app/genesis/pkg/cache/ristretto"
	ristretto_metrics "github.com/wildr-inc/app/genesis/pkg/cache/ristretto/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/compressor"
	"github.com/wildr-inc/app/genesis/pkg/marshaller"
	g_redis "github.com/wildr-inc/app/genesis/pkg/redis"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc/telemetry/tracer"

	"github.com/wildr-inc/app/genesis/pkg/cache/redis"

	"github.com/dgraph-io/ristretto"
	"github.com/go-redis/cache/v8"
	"go.opentelemetry.io/otel/metric"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// NewRedisCache for test.
func NewRedisCache(
	lc fx.Lifecycle,
	host string,
	logger *zap.Logger,
	compressor compressor.Compressor,
	marshaller marshaller.Marshaller,
	meter metric.Meter,
) (*cache.Cache, error) {
	params := redis.OptionsParams{
		Client:     NewRedisClient(lc, host, logger),
		Compressor: compressor,
		Marshaller: marshaller,
	}
	opts := redis.NewOptions(params)
	cache := redis.NewCache(
		redis.CacheParams{
			Lifecycle: lc,
			Config:    NewRedisConfig(host),
			Options:   opts,
			Version:   Version,
		},
	)

	err := redis_metrics.Register(cache, Version, meter)
	if err != nil {
		logger.Error("failed to create test redis cache", zap.Error(err))
		return nil, err
	}

	return redis.NewCache(
		redis.CacheParams{
			Lifecycle: lc,
			Config:    NewRedisConfig(host),
			Options:   opts,
			Version:   Version,
		},
	), err
}

// NewRedisClient for test.
func NewRedisClient(
	fxLifecycle fx.Lifecycle,
	host string,
	logger *zap.Logger,
) g_redis.Client {
	tracer, _ := tracer.NewTracer(
		tracer.Params{
			Lifecycle: fxLifecycle,
			Config:    NewTracerConfig(),
			Version:   Version,
		},
	)
	client := redis.NewClient(
		redis.ClientParams{
			Lifecycle:   fxLifecycle,
			RingOptions: redis.NewRingOptions(NewRedisConfig(host)),
			Tracer:      tracer,
			Logger:      logger,
		},
	)

	return client
}

// NewRedisConfig for test.
func NewRedisConfig(host string) *redis.Config {
	return &redis.Config{Addresses: map[string]string{"server": host}}
}

// NewRistrettoCache for test.
func NewRistrettoCache(lc fx.Lifecycle, meter metric.Meter) (*ristretto.Cache, error) {
	cfg := &g_ristretto.Config{
		NumCounters: 1e7,
		MaxCost:     1 << 30,
		BufferItems: 64,
	}
	c, _ := g_ristretto.NewCache(
		g_ristretto.CacheParams{Lifecycle: lc, Config: cfg, Version: Version},
	)

	err := ristretto_metrics.Register(c, Version, meter)
	if err != nil {
		zap.L().Error("failed to register ristretto logger", zap.Error(err))
	}

	return c, err
}
