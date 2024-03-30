package debug

import (
	"encoding/json"
	"net/http"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
	"go.uber.org/zap"
)

func psutil(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	resp := make(map[string]any)

	i, _ := cpu.InfoWithContext(ctx)
	t, _ := cpu.TimesWithContext(ctx, true)
	resp["cpu"] = map[string]any{
		"info":  i,
		"times": t,
	}

	s, _ := mem.SwapMemoryWithContext(ctx)
	v, _ := mem.VirtualMemoryWithContext(ctx)
	resp["mem"] = map[string]any{
		"swap":    s,
		"virtual": v,
	}

	w.Header().Add("Content-Type", "application/json")

	b, _ := json.Marshal(resp) //nolint:errchkjson
	_, err := w.Write(b)
	if err != nil {
		zap.L().Error("failed to write response in psutil handler", zap.Error(err))
	}
}
