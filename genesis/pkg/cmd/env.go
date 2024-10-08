package cmd

import (
	"encoding/base64"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/wildr-inc/app/genesis/pkg/file"
)

// ENV for cmd.
type ENV struct {
	location string
}

// NewENV for cmd.
func NewENV(location string) *ENV {
	return &ENV{location: location}
}

// Read for env.
func (e *ENV) Read() ([]byte, error) {
	if e.isMem() {
		_, e := e.split()

		return base64.StdEncoding.DecodeString(os.Getenv(e))
	}

	return os.ReadFile(e.path())
}

// Write for env.
func (e *ENV) Write(data []byte, mode fs.FileMode) error {
	if e.isMem() {
		_, e := e.split()

		return os.Setenv(e, base64.StdEncoding.EncodeToString(data))
	}

	return os.WriteFile(e.path(), data, mode)
}

// Write for env.
func (e *ENV) Kind() string {
	if e.isMem() {
		k, _ := e.split()

		return k
	}

	return file.Extension(e.path())
}

func (e *ENV) path() string {
	return filepath.Clean(e.name())
}

func (e *ENV) name() string {
	return os.Getenv(e.location)
}

func (e *ENV) isMem() bool {
	return strings.Contains(e.name(), ":")
}

func (e *ENV) split() (string, string) {
	s := strings.Split(e.name(), ":")
	if len(s) != 2 {
		return "yaml", e.name()
	}

	return s[0], s[1]
}
