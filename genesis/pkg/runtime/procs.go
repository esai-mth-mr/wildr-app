package runtime

import (
	"go.uber.org/automaxprocs/maxprocs"
	"go.uber.org/zap"
)

// Register runtime.
func Register() (err error) {
	_, err = maxprocs.Set()
	if err != nil {
		zap.L().Fatal("failed to set max procs", zap.Error(err))
	}
	return
}
