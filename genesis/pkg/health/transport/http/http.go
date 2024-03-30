package http

import (
	"encoding/json"
	"net/http"

	shttp "github.com/wildr-inc/app/genesis/pkg/transport/http"
	"github.com/wildr-inc/app/genesis/pkg/version"

	"github.com/alexfalkowski/go-health/subscriber"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/hashicorp/go-multierror"
	"go.uber.org/fx"
)

const (
	serving    = "SERVING"
	notServing = "NOT_SERVING"
)

// RegisterParams health for HTTP.
type RegisterParams struct {
	fx.In

	Server        *shttp.Server
	HttpHealth    *HttpHealthObserver
	HttpLiveness  *HttpLivenessObserver
	HttpReadiness *HttpReadinessObserver
	Version       version.Version
}

// Register health for HTTP.
func Register(params RegisterParams) error {
	var result *multierror.Error

	err := register(
		"/healthz",
		params.Server.Mux,
		params.HttpHealth.Observer,
		params.Version,
		true,
	)
	if err != nil {
		result = multierror.Append(result, err)
	}

	err = register(
		"/livez",
		params.Server.Mux,
		params.HttpLiveness.Observer,
		params.Version,
		false,
	)
	if err != nil {
		result = multierror.Append(result, err)
	}

	err = register(
		"/readyz",
		params.Server.Mux,
		params.HttpReadiness.Observer,
		params.Version,
		false,
	)
	if err != nil {
		result = multierror.Append(result, err)
	}

	if result != nil {
		return result.ErrorOrNil()
	}

	return nil
}

func register(
	path string,
	mux *runtime.ServeMux,
	ob *subscriber.Observer,
	version version.Version,
	withErrors bool,
) error {
	return mux.HandlePath(
		"GET",
		path,
		func(w http.ResponseWriter, r *http.Request, p map[string]string) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Version", string(version))

			var (
				status   int
				response string
			)

			if err := ob.Error(); err != nil {
				status = http.StatusServiceUnavailable
				response = notServing
			} else {
				status = http.StatusOK
				response = serving
			}

			w.WriteHeader(status)

			data := map[string]any{"status": response}
			if withErrors {
				errors := map[string]any{}
				for n, e := range ob.Errors() {
					if e == nil {
						continue
					}

					errors[n] = e.Error()
				}

				if len(errors) > 0 {
					data["errors"] = errors
				}
			}

			_ = json.NewEncoder(w).Encode(data)
		},
	)
}
