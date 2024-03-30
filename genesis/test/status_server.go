package test

import (
	"context"
	"fmt"
	"net/http"

	"go.uber.org/fx"
)

type StatusServerParams struct {
	fx.In

	Lifecycle fx.Lifecycle
	Port      string
}

func StatusServer(params StatusServerParams) {
	server := http.NewServeMux()

	server.HandleFunc("/v1/status/200", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	server.HandleFunc("/v1/status/500", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	})

	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%s", params.Port),
		Handler: server,
	}

	params.Lifecycle.Append(fx.Hook{
		OnStart: func(context.Context) error {
			go func() {
				if err := httpServer.ListenAndServe(); err != nil {
					fmt.Println(err) //nolint:forbidigo
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return httpServer.Shutdown(ctx)
		},
	})
}
