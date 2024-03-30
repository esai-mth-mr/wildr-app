package config

import (
	"time"
)

// Config for SQL DB.
type DSNConnConfig struct {
	Host     string `yaml:"host"     json:"host"     toml:"host"`
	Port     int    `yaml:"port"     json:"port"     toml:"port"`
	User     string `yaml:"user"     json:"user"     toml:"user"`
	Password string `yaml:"password" json:"password" toml:"password"`
	DBName   string `yaml:"database" json:"database" toml:"database"`
	SSLMode  string `yaml:"ssl_mode" json:"ssl_mode" toml:"ssl_mode"`
}

type DriverConfig struct {
	Masters         []DSNConnConfig `yaml:"masters"           json:"masters"           toml:"masters"`
	Slaves          []DSNConnConfig `yaml:"slaves"            json:"slaves"            toml:"slaves"`
	MaxOpenConns    int             `yaml:"max_open_conns"    json:"max_open_conns"    toml:"max_open_conns"`
	MaxIdleConns    int             `yaml:"max_idle_conns"    json:"max_idle_conns"    toml:"max_idle_conns"`
	ConnMaxLifetime time.Duration   `yaml:"conn_max_lifetime" json:"conn_max_lifetime" toml:"conn_max_lifetime"`
}
