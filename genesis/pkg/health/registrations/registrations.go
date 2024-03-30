package registrations

import (
	"time"

	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	health_tracer "github.com/wildr-inc/app/genesis/pkg/transport/http/telemetry/tracer"
	"github.com/wildr-inc/app/genesis/pkg/version"

	"github.com/alexfalkowski/go-health/checker"
	"github.com/alexfalkowski/go-health/server"
	"go.uber.org/zap"
)

// Registrations for health.
type Registrations = []*server.Registration

func registrations(
	cfg *Config,
	httpConfig *http.Config,
	healthTracer health_tracer.Tracer,
	version version.Version,
	logger *zap.Logger,
) (Registrations, error) {
	logger.Info("creating health registrations")
	client, err := http.NewClient(
		http.WithClientLogger(logger),
		http.WithClientTracer(healthTracer),
		http.WithClientUserAgent(httpConfig.UserAgent),
	)
	if err != nil {
		logger.Error("failed to create http client", zap.Error(err))
		return nil, err
	}

	if cfg == nil {
		logger.Error("failed to deserialize health config")
		return nil, nil
	}

	logger.Debug("health config", zap.Any("config", cfg))

	registrations := make(Registrations, 0, 10)

	if cfg.Http != nil {
		for _, checkerConfig := range *cfg.Http {
			logger.Info(
				"adding http checker for "+checkerConfig.Name,
				zap.String("address", checkerConfig.Address),
			)
			hc := checker.NewHTTPChecker(checkerConfig.Address, client)
			duration, err := time.ParseDuration(checkerConfig.Interval)
			if err != nil {
				logger.Error(
					"failed to parse duration for "+checkerConfig.Name,
					zap.Error(err),
				)
				return nil, err
			}
			hr := server.NewRegistration(
				checkerConfig.Name,
				duration,
				hc,
			)
			registrations = append(registrations, hr)
		}
	}

	if cfg.Tcp != nil {
		for _, checkerConfig := range *cfg.Tcp {
			logger.Info(
				"adding tcp checker for "+checkerConfig.Name,
				zap.String("address", checkerConfig.Address),
			)
			hc := checker.NewTCPChecker(checkerConfig.Address, 5*time.Second)
			duration, err := time.ParseDuration(checkerConfig.Interval)
			if err != nil {
				logger.Error(
					"failed to parse duration for "+checkerConfig.Name,
					zap.Error(err),
				)
				return nil, err
			}
			hr := server.NewRegistration(
				checkerConfig.Name,
				duration,
				hc,
			)
			registrations = append(registrations, hr)
		}
	}

	return registrations, nil
}
