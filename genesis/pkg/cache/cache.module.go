package cache

import (
	"github.com/wildr-inc/app/genesis/pkg/cache/compressor"
	"github.com/wildr-inc/app/genesis/pkg/cache/marshaller"
	"github.com/wildr-inc/app/genesis/pkg/cache/redis"
	rem "github.com/wildr-inc/app/genesis/pkg/cache/redis/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/cache/redis/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/cache/ristretto"
	rim "github.com/wildr-inc/app/genesis/pkg/cache/ristretto/telemetry/metrics"

	"go.uber.org/fx"
)

var (
	// RedisModule for fx.
	RedisModule = fx.Options(
		fx.Provide(redis.NewClient),
		fx.Provide(redis.NewOptions),
		fx.Provide(redis.NewCache),
		fx.Provide(redis.NewRingOptions),
		fx.Provide(tracer.NewTracer),
		fx.Invoke(rem.Register),
	)

	// RistrettoModule for fx.
	RistrettoModule = fx.Options(
		fx.Provide(ristretto.NewCache),
		fx.Invoke(rim.Register),
	)

	// SnappyCompressorModule for fx.
	SnappyCompressorModule = fx.Provide(compressor.NewSnappy)

	// ProtoMarshallerModule for fx.
	ProtoMarshallerModule = fx.Provide(marshaller.NewProto)
)
