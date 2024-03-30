package model_generator

import (
	"github.com/go-jet/jet/generator/postgres"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type ModelGenerator struct {
	config *Config
	logger *zap.Logger
}

type ModelGeneratorParams struct {
	fx.In

	Config *Config
	Logger *zap.Logger
}

func NewModelGenerator(params ModelGeneratorParams) *ModelGenerator {
	return &ModelGenerator{
		config: params.Config,
		logger: params.Logger,
	}
}

func (m *ModelGenerator) Generate() error {
	config := m.config.MasterConfig
	m.logger.Info("generating models")
	return postgres.Generate(m.config.ModelsPath,
		postgres.DBConnection{
			Host:       config.Host,
			Port:       config.Port,
			User:       config.User,
			Password:   config.Password,
			DBName:     config.DBName,
			SslMode:    config.SSLMode,
			SchemaName: "public",
		},
	)
}
