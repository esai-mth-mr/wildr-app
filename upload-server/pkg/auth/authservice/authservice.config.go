package authservice

type Config struct {
	URI  string `yaml:"uri" json:"uri" toml:"uri"`
	PORT int    `yaml:"port" json:"port" toml:"port"`
}
