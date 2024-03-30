package apiserver

import "time"

type Config struct {
	URI       string      `yaml:"uri" json:"uri" toml:"uri"`
	PORT      int         `yaml:"port" json:"port" toml:"port"`
	UserAgent string      `yaml:"user_agent" json:"user_agent" toml:"user_agent"`
	Retry     RetryConfig `yaml:"retry" json:"retry" toml:"retry"`
}

type RetryConfig struct {
	Timeout  time.Duration `yaml:"timeout" json:"timeout" toml:"timeout"`
	Attempts uint          `yaml:"attempts" json:"attempts" toml:"attempts"`
}
