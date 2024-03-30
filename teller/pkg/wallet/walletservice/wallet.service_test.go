package walletservice

import (
	"crypto/sha256"
	dbsql "database/sql"
	"encoding/base64"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/stdlib"
	"github.com/linxGnu/mssqlx"
	"github.com/ngrok/sqlmw"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"github.com/wildr-inc/app/genesis/test"
	"github.com/wildr-inc/app/teller/pkg/config"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletregion"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletstatus"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/wallettype"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletmarshaller"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletrepo"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
)

func TestWalletService(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../../config/config_test.yml")
	var walletService *WalletService
	var walletRepo *walletrepo.WalletRepo
	var db *mssqlx.DBs
	dbsql.Register("pg", sqlmw.Driver(stdlib.GetDefaultDriver(), sqlmw.NullInterceptor{}))
	const testUserId = "jfeksjekfjewlrfg"

	Convey("Given I have a wallet service", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(NewWalletService),
			fx.Populate(&walletRepo),
			fx.Populate(&walletService),
			fx.Populate(&db),
		)
		lc.RequireStart()

		db.Exec("DELETE FROM wallet")

		Convey("When I create a wallet for a user", func() {
			wallet, err := walletService.CreateForUser(
				CreateForUserParams{
					UserID: testUserId,
					Region: walletregion.India,
				},
			)
			So(err, ShouldBeNil)

			Convey("I should have a wallet in the database", func() {
				wallet, err := walletRepo.Get(walletrepo.GetParams{
					WalletID: wallet.ID,
				})
				So(err, ShouldBeNil)
				So(wallet.ID, ShouldNotBeEmpty)

				parts := strings.Split(wallet.ID, string(walletentity.ID_DELIMITER))

				So(len(parts), ShouldEqual, 5)
				// buffer
				So(parts[0], ShouldEqual, "_____")
				// region
				So(parts[1], ShouldEqual, "00")
				hashedId := sha256.Sum256([]byte(testUserId))
				hashBase64 := base64.StdEncoding.EncodeToString(hashedId[:32])
				// 16 bytes base64 encoded (unique id for wallet)
				So(parts[2], ShouldEqual, hashBase64[:16])
				// wallet num
				So(parts[3], ShouldEqual, "00")
				// page
				So(parts[4], ShouldEqual, "000")

				So(wallet.OwnerID, ShouldEqual, testUserId)
				So(wallet.Balances.Current, ShouldEqual, 0)
				So(wallet.Balances.Available, ShouldEqual, 0)
				So(wallet.Balances.Pending, ShouldEqual, 0)
				So(wallet.Page, ShouldEqual, walletentity.WalletPage{Entries: []string{}})
				So(wallet.Metadata.PageCount, ShouldEqual, 0)
				So(wallet.Type, ShouldEqual, wallettype.User)
				So(wallet.Status, ShouldEqual, walletstatus.Created)
				So(wallet.CreatedAt, ShouldHappenBefore, time.Now())
				So(wallet.UpdatedAt, ShouldHappenBefore, time.Now())
			})

			Convey("The wallet should be returned", func() {
				So(wallet.ID, ShouldNotBeEmpty)
				So(wallet.OwnerID, ShouldEqual, testUserId)
				So(wallet.Balances.Current, ShouldEqual, 0)
				So(wallet.Balances.Available, ShouldEqual, 0)
				So(wallet.Balances.Pending, ShouldEqual, 0)
				So(wallet.Page, ShouldEqual, walletentity.WalletPage{Entries: []string{}})
				So(wallet.Metadata.PageCount, ShouldEqual, 0)
				So(wallet.Type, ShouldEqual, wallettype.User)
				So(wallet.Status, ShouldEqual, walletstatus.Created)
				So(wallet.CreatedAt, ShouldHappenBefore, time.Now())
				So(wallet.UpdatedAt, ShouldHappenBefore, time.Now())
			})
		})

		Convey("When I try to create a wallet for a user that already has a wallet", func() {
			_, err := walletService.CreateForUser(
				CreateForUserParams{
					UserID: testUserId,
					Region: walletregion.India,
				},
			)
			So(err, ShouldBeNil)
			_, err = walletService.CreateForUser(
				CreateForUserParams{
					UserID: testUserId,
					Region: walletregion.India,
				},
			)
			Convey("I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})

		Convey("When I create a wallet with bad userId", func() {
			_, err := walletService.CreateForUser(CreateForUserParams{
				UserID: "kfwlkjflwkejflekwjflwjefklwef",
			})
			Convey("I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})

		Convey("When I create a wallet with bad region", func() {
			_, err := walletService.CreateForUser(CreateForUserParams{
				UserID: testUserId,
				Region: walletregion.WalletRegion(100),
			})
			Convey("I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})

		lc.RequireStop()
	})

	Convey("Given I have a wallet service with a bad db connection", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(NewWalletService),
			fx.Populate(&walletRepo),
			fx.Populate(&walletService),
			fx.Populate(&db),
		)
		lc.RequireStart()

		db.Destroy()

		Convey("When I create a wallet for a user", func() {
			_, err := walletService.CreateForUser(
				CreateForUserParams{
					UserID: testUserId,
					Region: walletregion.India,
				},
			)
			Convey("I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})

		lc.RequireStop()
	})

	Convey("Given I have a wallet service", t, func() {
		const testUserId = "jfeksjekfjewlrfg"

		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(NewWalletService),
			fx.Populate(&walletRepo),
			fx.Populate(&walletService),
			fx.Populate(&db),
		)
		lc.RequireStart()

		db.Exec("DELETE FROM wallet")

		Convey("When I create a wallet for a user", func() {
			_, err := walletService.CreateForUser(
				CreateForUserParams{
					UserID: testUserId,
					Region: walletregion.India,
				},
			)
			So(err, ShouldBeNil)

			Convey("Then retrieve the wallet", func() {
				wallet, err := walletService.GetForUser(
					GetForUserParams{
						UserID: testUserId,
					},
				)
				So(err, ShouldBeNil)
				Convey("I should have a wallet", func() {
					expId := walletentity.GetWalletId(walletentity.GetWalletIdParams{
						Region:       walletregion.India,
						UserID:       testUserId,
						WalletNumber: 0,
						Page:         0,
					})
					So(wallet, ShouldEqual, &walletentity.WalletEntity{
						ID:      expId,
						OwnerID: testUserId,
						Balances: walletentity.WalletBalances{
							Current:   0,
							Available: 0,
							Pending:   0,
						},
						Page: walletentity.WalletPage{
							Entries: []string{},
						},
						Metadata: &walletentity.WalletMetadata{
							PageCount: 0,
						},
						Type:      wallettype.User,
						Status:    walletstatus.Created,
						CreatedAt: wallet.CreatedAt,
						UpdatedAt: wallet.UpdatedAt,
					})
					oneSecondAgo := time.Now().Add(-1 * time.Second)
					So(wallet.CreatedAt, ShouldHappenBetween, oneSecondAgo, time.Now())
					So(wallet.UpdatedAt, ShouldHappenBetween, oneSecondAgo, time.Now())
				})
			})
		})

		Convey("When I try to retrieve a wallet for a user that doesn't have a wallet", func() {
			wallet, err := walletService.GetForUser(
				GetForUserParams{
					UserID: testUserId,
				},
			)
			So(err, ShouldBeNil)
			Convey("I should gen an empty wallet", func() {
				So(wallet, ShouldNotBeNil)
				walletId := walletentity.GetWalletId(walletentity.GetWalletIdParams{
					Region:       walletregion.India,
					UserID:       testUserId,
					WalletNumber: 0,
					Page:         0,
				})
				So(wallet, ShouldEqual, &walletentity.WalletEntity{
					ID:      walletId,
					OwnerID: testUserId,
					Balances: walletentity.WalletBalances{
						Current:   0,
						Available: 0,
						Pending:   0,
					},
					Page: walletentity.WalletPage{
						Entries: []string{},
					},
					Metadata: &walletentity.WalletMetadata{
						PageCount: 0,
					},
					Type:      wallettype.User,
					Status:    walletstatus.PreCreation,
					CreatedAt: wallet.CreatedAt,
					UpdatedAt: wallet.UpdatedAt,
				})
			})
		})
	})

	Convey("Given I have a wallet service with a bad db connection", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(NewWalletService),
			fx.Populate(&walletRepo),
			fx.Populate(&walletService),
			fx.Populate(&db),
		)
		lc.RequireStart()

		db.Destroy()

		Convey("When I retrieve a wallet for a user", func() {
			_, err := walletService.GetForUser(
				GetForUserParams{
					UserID: testUserId,
				},
			)
			Convey("I should get an error", func() {
				So(err, ShouldNotBeNil)
			})
		})

		lc.RequireStop()
	})

	Convey("Given I have a wallet service", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			validator.Module,
			fx.Provide(pg.Open),
			fx.Provide(test.NewLogger),
			fx.Provide(walletmarshaller.NewWalletMarshaller),
			fx.Provide(walletrepo.NewWalletRepo),
			fx.Provide(NewWalletService),
			fx.Populate(&walletRepo),
			fx.Populate(&walletService),
			fx.Populate(&db),
		)
		lc.RequireStart()

		db.Exec("DELETE FROM wallet")

		Convey("When I create a wallet for a user with a bad id", func() {
			_, err := walletService.CreateForUser(
				CreateForUserParams{
					UserID: testUserId,
					Region: walletregion.India,
				},
			)
			So(err, ShouldBeNil)

			Convey("Then I should receive a validation error", func() {
				wallet, err := walletService.GetForUser(
					GetForUserParams{
						UserID: "kfwlkjflwkejflekwjflwjefklwef",
					},
				)
				So(err, ShouldNotBeNil)
				So(wallet, ShouldBeNil)
			})
		})

		lc.RequireStop()
	})
}
