package teller_test

import (
	"context"
	"os"
	"testing"

	"github.com/linxGnu/mssqlx"
	. "github.com/smartystreets/goconvey/convey"
	g_grpc "github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/teller/pkg/app"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletrepo"
	teller_pb "github.com/wildr-inc/app/teller/proto/teller"
	wallet_pb "github.com/wildr-inc/app/teller/proto/wallet"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"google.golang.org/grpc"
)

func TestRetrieveWallet(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../config/config_test.yml")
	var db *mssqlx.DBs
	var r *walletrepo.WalletRepo
	var grpcConfig *g_grpc.Config
	const testUserId = "jfeksjekfjewlrfg"

	Convey("Given ann app", t, func() {
		lc := fxtest.New(t,
			app.Module,
			fx.Populate(&db),
			fx.Populate(&r),
			fx.Populate(&grpcConfig),
		)
		defer lc.RequireStart().RequireStop()

		conn, err := grpc.Dial("localhost:"+grpcConfig.Port, grpc.WithInsecure(), grpc.WithBlock())
		So(err, ShouldBeNil)
		defer conn.Close()

		db.Exec("delete from wallet")

		client := teller_pb.NewTellerClient(conn)

		Convey("When an RPC is made to retrieve a wallet for a user with now wallet", func() {
			resp, err := client.RetrieveWallet(
				context.Background(),
				&teller_pb.RetrieveWalletRequest{
					UserId: testUserId,
				},
			)
			So(err, ShouldBeNil)

			Convey("Then the response should be valid", func() {
				So(resp, ShouldNotBeNil)
				So(resp.Wallet, ShouldNotBeNil)
				expId := walletentity.GetWalletId(
					walletentity.GetWalletIdParams{UserID: testUserId},
				)
				So(resp.Wallet.Id, ShouldEqual, expId)
				So(resp.Wallet.UserId, ShouldEqual, testUserId)
				So(resp.Wallet.Balances.Current, ShouldEqual, 0)
				So(resp.Wallet.Balances.Pending, ShouldEqual, 0)
				So(resp.Wallet.Balances.Available, ShouldEqual, 0)
				So(resp.Wallet.Status, ShouldEqual, wallet_pb.Status_Active)
			})
		})
	})
}
