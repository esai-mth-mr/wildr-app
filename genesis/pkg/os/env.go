package os

import (
	"os"
	"strings"
)

func GetFromEnv(value string) string {
	s := strings.Split(value, ":")
	if len(s) != 2 || s[0] != "env" {
		return value
	}
	return os.Getenv(s[1])
}
