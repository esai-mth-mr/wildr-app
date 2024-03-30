package teller_test

import (
	"context"
	"os"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	g_grpc "github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/teller/pkg/app"
	teller_pb "github.com/wildr-inc/app/teller/proto/teller"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"google.golang.org/grpc"
)

func TestGetExchangeRate(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../config/config_test.yml")
	var grpcConfig *g_grpc.Config

	Convey("Given ann app", t, func() {
		lc := fxtest.New(t,
			app.Module,
			fx.Populate(&grpcConfig),
		)
		defer lc.RequireStart().RequireStop()

		conn, err := grpc.Dial(
			"localhost:"+grpcConfig.Port,
			grpc.WithInsecure(),
			grpc.WithBlock(),
		)
		So(err, ShouldBeNil)
		defer conn.Close()

		client := teller_pb.NewTellerClient(conn)

		Convey("When an RPC is made to retrieve an exchange rate", func() {
			resp, err := client.GetExchangeRate(
				context.Background(),
				&teller_pb.GetExchangeRateRequest{
					Currency: "INR",
				},
			)
			So(err, ShouldBeNil)

			Convey("Then the response should be valid", func() {
				So(resp, ShouldNotBeNil)
				So(resp.ExchangeRate, ShouldNotBeNil)
				So(resp.ExchangeRate, ShouldEqual, 1)
			})
		})

		Convey("When an RPC is made to retrieve an exchange rate with an invalid currency", func() {
			resp, err := client.GetExchangeRate(
				context.Background(),
				&teller_pb.GetExchangeRateRequest{
					Currency: "EUR",
				},
			)

			Convey("Then the response should be valid", func() {
				So(resp, ShouldBeNil)
				So(err, ShouldNotBeNil)
			})
		})
	})
}
