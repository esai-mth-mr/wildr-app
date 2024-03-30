package registrations

type Config struct {
	Http *[]CheckConfig `yaml:"http" json:"http" toml:"http"`
	Tcp  *[]CheckConfig `yaml:"tcp"  json:"tcp"  toml:"tcp"`
}

type CheckConfig struct {
	Name     string `yaml:"name"     json:"name"     toml:"name"`
	Interval string `yaml:"interval" json:"interval" toml:"interval"`
	Timeout  string `yaml:"timeout"  json:"timeout"  toml:"timeout"`
	Address  string `yaml:"address"  json:"address"  toml:"address"`
}
