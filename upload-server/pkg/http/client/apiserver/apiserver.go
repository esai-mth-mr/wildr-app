package apiserver

import (
	"net/http"

	ghttp "github.com/wildr-inc/app/genesis/pkg/transport/http"
	"github.com/wildr-inc/app/genesis/pkg/transport/http/retry"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Client struct {
	client *http.Client
}

type NewClientParams struct {
	fx.In

	Logger    *zap.Logger
	Lifecycle fx.Lifecycle
	Config    *Config
}

func NewClient(params NewClientParams) (*Client, error) {

	retryConfig := &retry.Config{
		Timeout:  params.Config.Retry.Timeout,
		Attempts: params.Config.Retry.Attempts,
	}

	logger := params.Logger.Named("api_server_client")
	client, err := ghttp.NewClient(
		ghttp.WithClientLogger(logger),
		ghttp.WithClientUserAgent(params.Config.UserAgent),
		ghttp.WithClientRetry(retryConfig),
		ghttp.WithClientBreaker(),
	)
	if err != nil {
		return nil, err
	}

	return &Client{
		client: client,
	}, nil
}

func (c *Client) HTTPClient() *http.Client {
	return c.client
}
