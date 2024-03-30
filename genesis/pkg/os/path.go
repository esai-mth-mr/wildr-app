package os

import (
	"os"
	"path/filepath"
)

func ExecutableName() string {
	path, _ := os.Executable()
	return filepath.Base(path)
}
