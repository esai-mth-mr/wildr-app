package http_test

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/wildr-inc/app/genesis/pkg/limiter"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/tracer"
	grpc_token "github.com/wildr-inc/app/genesis/pkg/transport/grpc/security/token"
	http_limiter "github.com/wildr-inc/app/genesis/pkg/transport/http/limiter"
	http_token "github.com/wildr-inc/app/genesis/pkg/transport/http/security/token"
	"github.com/wildr-inc/app/genesis/pkg/transport/meta"
	"github.com/wildr-inc/app/genesis/test"
	greet_v1 "github.com/wildr-inc/app/genesis/test/greet/v1"

	. "github.com/smartystreets/goconvey/convey" //nolint:revive
	"github.com/urfave/negroni/v3"
	"go.uber.org/fx/fxtest"
	"google.golang.org/grpc"
)

func init() {
	tracer.Register()
}

func TestUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			m,
			nil,
			nil,
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx, cancel := context.WithDeadline(
			context.Background(),
			time.Now().Add(10*time.Minute),
		)
		defer cancel()

		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for a greet", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				m,
			)

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				context.Background(),
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Request-ID", "test")
			req.Header.Set("X-Forwarded-For", "test")
			req.Header.Set("Geolocation", "test")

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a valid reply", func() {
				So(actual, ShouldEqual, `{"message":"Hello test"}`)
			})

			fxLifecycle.RequireStop()
		})
	})
}

func TestDefaultClientUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			m,
			nil,
			nil,
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx, cancel := context.WithDeadline(
			context.Background(),
			time.Now().Add(10*time.Minute),
		)
		defer cancel()

		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for a greet", func() {
			client := http.DefaultClient

			ctx, cancel := context.WithTimeout(
				context.Background(),
				10*time.Second,
			)
			defer cancel()

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				ctx,
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a valid reply", func() {
				So(actual, ShouldEqual, `{"message":"Hello test"}`)
			})

			fxLifecycle.RequireStop()
		})
	})
}

//nolint:dupl
func TestValidAuthUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		verifier := test.NewVerifier("test")
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			true,
			m,
			[]grpc.UnaryServerInterceptor{grpc_token.UnaryServerInterceptor(verifier)},
			[]grpc.StreamServerInterceptor{
				grpc_token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx := context.Background()
		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for an authenticated greet", func() {
			transport := http_token.NewRoundTripper(
				test.NewGenerator("test", nil),
				http.DefaultTransport,
			)
			client := test.NewHTTPClientWithRoundTripper(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				transport,
				m,
			) //nolint:contextcheck

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				ctx,
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Request-ID", "test")

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a valid reply", func() {
				So(actual, ShouldEqual, `{"message":"Hello test"}`)
			})

			fxLifecycle.RequireStop()
		})
	})
}

//nolint:dupl
func TestInvalidAuthUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		verifier := test.NewVerifier("test")
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			true,
			m,
			[]grpc.UnaryServerInterceptor{grpc_token.UnaryServerInterceptor(verifier)},
			[]grpc.StreamServerInterceptor{
				grpc_token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx := context.Background()
		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for a unauthenticated greet", func() {
			transport := http_token.NewRoundTripper(
				test.NewGenerator("bob", nil),
				http.DefaultTransport,
			)
			client := test.NewHTTPClientWithRoundTripper(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				transport,
				m,
			) //nolint:contextcheck

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				ctx,
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Request-ID", "test")

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a unauthenticated reply", func() {
				So(
					actual,
					ShouldContainSubstring,
					`could not verify token: invalid token`,
				)
			})

			fxLifecycle.RequireStop()
		})
	})
}

//nolint:dupl
func TestMissingAuthUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		verifier := test.NewVerifier("test")
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			true,
			m,
			[]grpc.UnaryServerInterceptor{grpc_token.UnaryServerInterceptor(verifier)},
			[]grpc.StreamServerInterceptor{
				grpc_token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx := context.Background()
		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for a unauthenticated greet", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				m,
			) //nolint:contextcheck

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				ctx,
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Request-ID", "test")

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a unauthenticated reply", func() {
				So(actual, ShouldContainSubstring, "authorization is invalid")
			})

			fxLifecycle.RequireStop()
		})
	})
}

func TestEmptyAuthUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		verifier := test.NewVerifier("test")
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			true,
			m,
			[]grpc.UnaryServerInterceptor{grpc_token.UnaryServerInterceptor(verifier)},
			[]grpc.StreamServerInterceptor{
				grpc_token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx := context.Background()
		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for a unauthenticated greet", func() {
			transport := http_token.NewRoundTripper(
				test.NewGenerator("", nil),
				http.DefaultTransport,
			)
			client := test.NewHTTPClientWithRoundTripper(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				transport,
				m,
			) //nolint:contextcheck

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				ctx,
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Request-ID", "test")

			_, err = client.Do(req)

			Convey("Then I should have an auth error", func() {
				So(err, ShouldBeError)
				So(
					err.Error(),
					ShouldContainSubstring,
					"authorization is invalid",
				)
			})

			fxLifecycle.RequireStop()
		})
	})
}

//nolint:dupl
func TestMissingClientAuthUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		verifier := test.NewVerifier("test")
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			true,
			m,
			[]grpc.UnaryServerInterceptor{grpc_token.UnaryServerInterceptor(verifier)},
			[]grpc.StreamServerInterceptor{
				grpc_token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx := context.Background()
		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey("When I query for a unauthenticated greet", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				m,
			) //nolint:contextcheck

			message := []byte(`{"name":"test"}`)
			req, err := http.NewRequestWithContext(
				ctx,
				"POST",
				fmt.Sprintf(
					"http://localhost:%s/v1/greet/hello",
					cfg.HTTP.Port,
				),
				bytes.NewBuffer(message),
			)
			So(err, ShouldBeNil)

			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Request-ID", "test")

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a unauthenticated reply", func() {
				So(actual, ShouldContainSubstring, "authorization is invalid")
			})

			fxLifecycle.RequireStop()
		})
	})
}

func TestTokenErrorAuthUnary(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)
		verifier := test.NewVerifier("test")
		cfg := test.NewInsecureTransportConfig()

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			nil,
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			true,
			m,
			[]grpc.UnaryServerInterceptor{grpc_token.UnaryServerInterceptor(verifier)},
			[]grpc.StreamServerInterceptor{
				grpc_token.StreamServerInterceptor(verifier),
			},
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		ctx := context.Background()
		conn := test.NewGRPCClient(
			ctx,
			fxLifecycle,
			logger,
			cfg,
			test.NewTracerConfig(),
			nil,
			m,
		)
		defer conn.Close()

		err = greet_v1.RegisterGreeterServiceHandler(ctx, httpServer.Mux, conn)
		So(err, ShouldBeNil)

		Convey(
			"When I query for a greet that will generate a token error",
			func() {
				transport := http_token.NewRoundTripper(
					test.NewGenerator("", errors.New("token error")),
					http.DefaultTransport,
				)
				client := test.NewHTTPClientWithRoundTripper(
					fxLifecycle,
					logger,
					test.NewTracerConfig(),
					cfg,
					transport,
					m,
				) //nolint:contextcheck

				message := []byte(`{"name":"test"}`)
				req, err := http.NewRequestWithContext(
					ctx,
					"POST",
					fmt.Sprintf(
						"http://localhost:%s/v1/greet/hello",
						cfg.HTTP.Port,
					),
					bytes.NewBuffer(message),
				)
				So(err, ShouldBeNil)

				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("Request-ID", "test")

				_, err = client.Do(req)

				Convey("Then I should have an error", func() {
					So(err, ShouldBeError)
					So(err.Error(), ShouldContainSubstring, "token error")
				})

				fxLifecycle.RequireStop()
			},
		)
	})
}

func TestGet(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)

		l, err := limiter.New("100-S")
		So(err, ShouldBeNil)

		cfg := test.NewInsecureTransportConfig()
		cfg.GRPC.Enabled = false

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			[]negroni.Handler{http_limiter.NewHandler(l, meta.UserAgent)},
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			m,
			nil,
			nil,
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		err = httpServer.Mux.HandlePath(
			"GET",
			"/hello",
			func(w http.ResponseWriter, r *http.Request, pathParams map[string]string) {
				w.Header().Set("Content-Type", "text/plain")
				w.WriteHeader(http.StatusOK)
				_, err = w.Write([]byte("hello!"))
				if err != nil {
					panic(err)
				}
			},
		)
		So(err, ShouldBeNil)

		Convey("When I query for a greet", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				m,
			)

			req, err := http.NewRequestWithContext(
				context.Background(),
				"GET",
				fmt.Sprintf("http://localhost:%s/hello", cfg.HTTP.Port),
				bytes.NewBufferString("hi"),
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			So(err, ShouldBeNil)

			actual := strings.TrimSpace(string(body))

			Convey("Then I should have a valid greet", func() {
				So(actual, ShouldEqual, "hello!")
			})

			fxLifecycle.RequireStop()
		})
	})
}

func TestLimiter(t *testing.T) {
	Convey("Given I have a all the servers", t, func() {
		fxLifecycle := fxtest.NewLifecycle(t)
		logger := test.NewLogger(fxLifecycle)

		l, err := limiter.New("0-S")
		So(err, ShouldBeNil)

		cfg := test.NewInsecureTransportConfig()
		cfg.GRPC.Enabled = false

		m, err := metrics.NewMeter(fxLifecycle, test.Environment, test.Version)
		So(err, ShouldBeNil)

		httpServer := test.NewHTTPServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			m,
			[]negroni.Handler{http_limiter.NewHandler(l, meta.UserAgent)},
		)
		grpcServer := test.NewGRPCServer(
			fxLifecycle,
			logger,
			test.NewTracerConfig(),
			cfg,
			false,
			m,
			nil,
			nil,
		)

		test.RegisterTransport(fxLifecycle, cfg, grpcServer, httpServer)
		fxLifecycle.RequireStart()

		err = httpServer.Mux.HandlePath(
			"GET",
			"/hello",
			func(w http.ResponseWriter, r *http.Request, pathParams map[string]string) {
				_, err := w.Write([]byte("hello!"))
				So(err, ShouldBeNil)
			},
		)
		So(err, ShouldBeNil)

		Convey("When I query for a greet", func() {
			client := test.NewHTTPClient(
				fxLifecycle,
				logger,
				test.NewTracerConfig(),
				cfg,
				m,
			)

			req, err := http.NewRequestWithContext(
				context.Background(),
				"GET",
				fmt.Sprintf("http://localhost:%s/hello", cfg.HTTP.Port),
				nil,
			)
			So(err, ShouldBeNil)

			resp, err := client.Do(req)
			So(err, ShouldBeNil)

			defer resp.Body.Close()

			Convey("Then I should have been rate limited", func() {
				So(resp.StatusCode, ShouldEqual, http.StatusTooManyRequests)
				So(resp.Header.Get("X-Rate-Limit-Limit"), ShouldEqual, "0")
			})

			fxLifecycle.RequireStop()
		})
	})
}
