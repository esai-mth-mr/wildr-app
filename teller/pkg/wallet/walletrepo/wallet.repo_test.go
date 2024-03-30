package walletrepo

import (
	dbsql "database/sql"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/stdlib"
	"github.com/linxGnu/mssqlx"
	"github.com/ngrok/sqlmw"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"github.com/wildr-inc/app/teller/pkg/config"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletmarshaller"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"go.uber.org/zap"
)

func NewTestLogger() *zap.Logger {
	return zap.NewNop()
}

func TestWalletRepo(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../../config/config_test.yml")
	var walletRepo *WalletRepo
	var db *mssqlx.DBs
	dbsql.Register("pg", sqlmw.Driver(stdlib.GetDefaultDriver(), sqlmw.NullInterceptor{}))

	Convey("Given I have a wallet repo", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			fx.Provide(pg.Open),
			fx.Provide(NewTestLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(NewWalletRepo),
			fx.Populate(&walletRepo),
			fx.Populate(&db),
		)
		lc.RequireStart()

		db.Exec("DELETE FROM wallet")

		Convey("When create a valid wallet", func() {
			walletEntity := walletentity.NewForUser(
				walletentity.NewForUserParams{
					UserID: "test-user-id",
				},
			)
			createdWallet, err := walletRepo.Create(
				CreateParams{
					Wallet: walletEntity,
				},
			)
			So(err, ShouldBeNil)

			Convey("I should receive the created wallet", func() {
				So(createdWallet, ShouldNotBeNil)
				So(createdWallet.ID, ShouldEqual, walletEntity.ID)
				So(createdWallet.OwnerID, ShouldEqual, walletEntity.OwnerID)
				So(createdWallet.Balances, ShouldEqual, walletEntity.Balances)
				So(createdWallet.Page, ShouldEqual, walletEntity.Page)
				So(createdWallet.FirstEntryDate, ShouldEqual, walletEntity.FirstEntryDate)
				So(createdWallet.LastEntryDate, ShouldEqual, walletEntity.LastEntryDate)
				So(createdWallet.Metadata, ShouldEqual, walletEntity.Metadata)
				So(createdWallet.Type, ShouldEqual, walletEntity.Type)
				So(createdWallet.Status, ShouldEqual, walletEntity.Status)
				So(createdWallet.CreatedAt, ShouldHappenOnOrAfter, walletEntity.CreatedAt)
				So(createdWallet.UpdatedAt, ShouldHappenOnOrAfter, walletEntity.UpdatedAt)
			})

			Convey("I should have a wallet in the database", func() {
				wallet, err := walletRepo.Get(
					GetParams{
						WalletID: walletEntity.ID,
					},
				)
				So(err, ShouldBeNil)
				So(wallet, ShouldNotBeNil)
				So(wallet.ID, ShouldEqual, walletEntity.ID)
				So(wallet.OwnerID, ShouldEqual, walletEntity.OwnerID)
				So(wallet.Balances, ShouldEqual, walletEntity.Balances)
				So(wallet.Page, ShouldEqual, walletEntity.Page)
				So(wallet.FirstEntryDate, ShouldEqual, walletEntity.FirstEntryDate)
				So(wallet.LastEntryDate, ShouldEqual, walletEntity.LastEntryDate)
				So(wallet.Metadata, ShouldEqual, walletEntity.Metadata)
				So(wallet.Type, ShouldEqual, walletEntity.Type)
				So(wallet.Status, ShouldEqual, walletEntity.Status)
				So(wallet.CreatedAt, ShouldHappenAfter, walletEntity.CreatedAt)
				So(wallet.UpdatedAt, ShouldHappenAfter, walletEntity.UpdatedAt)
			})
		})

		Convey("When a valid wallet exists", func() {
			walletEntity := walletentity.NewForUser(
				walletentity.NewForUserParams{
					UserID: "test-user-id",
				},
			)
			_, err := walletRepo.Create(
				CreateParams{
					Wallet: walletEntity,
				},
			)
			So(err, ShouldBeNil)

			Convey("I should be able to Get the wallet from db", func() {
				wallet, err := walletRepo.Get(
					GetParams{
						WalletID: walletEntity.ID,
					},
				)
				So(err, ShouldBeNil)
				So(wallet, ShouldNotBeNil)
				So(wallet.ID, ShouldEqual, walletEntity.ID)
				So(wallet.OwnerID, ShouldEqual, walletEntity.OwnerID)
				So(wallet.Balances, ShouldEqual, walletEntity.Balances)
				So(wallet.Page, ShouldEqual, walletEntity.Page)
				So(wallet.FirstEntryDate, ShouldEqual, walletEntity.FirstEntryDate)
				So(wallet.LastEntryDate, ShouldEqual, walletEntity.LastEntryDate)
				So(wallet.Metadata, ShouldEqual, walletEntity.Metadata)
				So(wallet.Type, ShouldEqual, walletEntity.Type)
				So(wallet.Status, ShouldEqual, walletEntity.Status)
				So(wallet.CreatedAt, ShouldHappenAfter, walletEntity.CreatedAt)
				So(wallet.UpdatedAt, ShouldHappenAfter, walletEntity.UpdatedAt)
			})
		})

		Convey("When a wallet does not exist", func() {
			wallet, err := walletRepo.Get(
				GetParams{
					WalletID: "test-wallet-id",
				},
			)
			Convey("I should get an error when attempting to retrieve it", func() {
				So(err, ShouldNotBeNil)
				So(wallet, ShouldBeNil)
				So(err.Error(), ShouldEqual, "wallet not found")
				So(err.Type(), ShouldEqual, errortypes.WalletNotFoundError)
			})
		})

		lc.RequireStop()
	})
}
