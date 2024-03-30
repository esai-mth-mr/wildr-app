package debug

import (
	"net/http/pprof"

	"github.com/wildr-inc/app/genesis/pkg/env"

	"github.com/arl/statsviz"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

// RegisterParams for debug.
type RegisterParams struct {
	fx.In

	Lifecycle fx.Lifecycle
	Config    *Config
	Env       env.Environment
	Logger    *zap.Logger
}

// Register debug.
func Register(params RegisterParams) error {
	if !params.Env.IsDevelopment() {
		return nil
	}

	m := mux(params.Lifecycle, params.Config, params.Logger)

	// Register statsviz.
	err := statsviz.Register(m)
	if err != nil {
		return err
	}

	// Register pprof.
	m.HandleFunc("/debug/pprof/", pprof.Index)
	m.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
	m.HandleFunc("/debug/pprof/profile", pprof.Profile)
	m.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	m.HandleFunc("/debug/pprof/trace", pprof.Trace)

	// Register psutil.
	m.HandleFunc("/debug/psutil", psutil)

	return nil
}
