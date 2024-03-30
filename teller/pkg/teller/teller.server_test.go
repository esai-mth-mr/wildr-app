package teller

import (
	"context"
	dbsql "database/sql"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/stdlib"
	"github.com/linxGnu/mssqlx"
	"github.com/ngrok/sqlmw"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/runtime"
	"github.com/wildr-inc/app/genesis/pkg/telemetry/metrics"
	"github.com/wildr-inc/app/genesis/pkg/transport"
	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/genesis/pkg/transport/http"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"github.com/wildr-inc/app/genesis/test"
	"github.com/wildr-inc/app/teller/pkg/config"
	"github.com/wildr-inc/app/teller/pkg/exchangerate"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletregion"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletmarshaller"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletrepo"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletservice"
	"github.com/wildr-inc/app/teller/proto/teller"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
)

func TestTellerServer(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../config/config_test.yml")
	var db *mssqlx.DBs
	var s *TellerServer
	var r *walletrepo.WalletRepo
	dbsql.Register("pg", sqlmw.Driver(stdlib.GetDefaultDriver(), sqlmw.NullInterceptor{}))
	const testUserId = "jfeksjekfjewlrfg"

	Convey("Given a teller service", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			metrics.Module,
			Module,
			transport.Module,
			fx.Provide(grpc.UnaryServerInterceptor),
			fx.Provide(grpc.StreamServerInterceptor),
			fx.Provide(http.ServerHandlers),
			runtime.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(walletservice.NewWalletService),
			fx.Provide(exchangerate.NewExchangeRateService),
			fx.Populate(&s),
			fx.Populate(&db),
			fx.Populate(&r),
		)
		lc.RequireStart()

		db.Exec("DELETE FROM wallet")

		Convey("When a wallet is retrieved for user without wallet", func() {
			res, err := s.RetrieveWallet(context.Background(), &teller.RetrieveWalletRequest{
				UserId: testUserId,
			})
			So(err, ShouldBeNil)

			Convey("An empty wallet is returned", func() {
				So(res.Wallet, ShouldNotBeNil)
				walletId := walletentity.GetWalletId(walletentity.GetWalletIdParams{
					UserID:       testUserId,
					Page:         0,
					Region:       walletregion.India,
					WalletNumber: 0,
				})
				So(res.Wallet.Id, ShouldEqual, walletId)
				So(res.Wallet.UserId, ShouldEqual, testUserId)
				So(res.Wallet.Balances.Current, ShouldEqual, 0)
				So(res.Wallet.Balances.Pending, ShouldEqual, 0)
				So(res.Wallet.Balances.Available, ShouldEqual, 0)
			})
		})

		Convey("When a wallet is retrieved for user with wallet", func() {
			wallet := walletentity.NewForUser(walletentity.NewForUserParams{
				UserID: testUserId,
				Region: walletregion.India,
			})
			wallet.Balances.Current = 100 // something to check this isn't blank
			So(wallet, ShouldNotBeNil)
			r.Create(walletrepo.CreateParams{
				Wallet: wallet,
			})
			Convey("The wallet is returned", func() {
				res, err := s.RetrieveWallet(context.Background(), &teller.RetrieveWalletRequest{
					UserId: testUserId,
				})
				So(err, ShouldBeNil)
				So(res.Wallet, ShouldNotBeNil)
				So(res.Wallet.Id, ShouldEqual, wallet.ID)
				So(res.Wallet.UserId, ShouldEqual, testUserId)
				So(res.Wallet.Balances.Current, ShouldEqual, 100)
				So(res.Wallet.Balances.Pending, ShouldEqual, 0)
				So(res.Wallet.Balances.Available, ShouldEqual, 0)
			})
		})

		Convey("When the exchange rate is retrieved", func() {
			res, err := s.GetExchangeRate(context.Background(), &teller.GetExchangeRateRequest{
				Currency: "INR",
			})

			Convey("The exchange rate is returned", func() {
				So(err, ShouldBeNil)
				So(res.ExchangeRate, ShouldNotBeNil)
				So(res.ExchangeRate, ShouldEqual, 1)
			})
		})

		lc.RequireStop()
	})

	Convey("Given a teller service with a bad wallet service", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			metrics.Module,
			Module,
			transport.Module,
			fx.Provide(grpc.UnaryServerInterceptor),
			fx.Provide(grpc.StreamServerInterceptor),
			fx.Provide(http.ServerHandlers),
			runtime.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(exchangerate.NewExchangeRateService),
			fx.Provide(walletservice.NewWalletService),
			fx.Populate(&s),
			fx.Populate(&db),
			fx.Populate(&r),
		)
		lc.RequireStart()

		db.Exec("DELETE FROM wallet")

		db.Destroy()

		Convey("When wallet is retrieved", func() {
			res, err := s.RetrieveWallet(context.Background(), &teller.RetrieveWalletRequest{
				UserId: testUserId,
			})

			Convey("An error is returned", func() {
				So(err, ShouldNotBeNil)
				So(res, ShouldBeNil)
			})
		})

		lc.RequireStop()
	})
}
