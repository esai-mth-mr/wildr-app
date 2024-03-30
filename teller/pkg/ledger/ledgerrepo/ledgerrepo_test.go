package ledgerrepo

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
	"github.com/wildr-inc/app/teller/pkg/config"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity/ledgerentry"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgermarshaller"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func NewTestLogger() *zap.Logger {
	return zap.NewNop()
}

func TestLedgerRepo(t *testing.T) {
	os.Setenv("CONFIG_FILE", "../../../config/config_test.yml")
	var repo *LedgerRepo
	var db *mssqlx.DBs
	dbsql.Register("pg", sqlmw.Driver(stdlib.GetDefaultDriver(), sqlmw.NullInterceptor{}))

	Convey("Given I have a ledger repo", t, func() {
		lc := fxtest.New(t,
			config.Module,
			cmd.Module,
			fx.Provide(pg.Open),
			fx.Provide(),
			fx.Provide(ledgermarshaller.NewLedgerMarshaller),
			fx.Provide(NewTestLogger),
			fx.Provide(NewLedgerRepo),
			fx.Populate(&repo),
			fx.Populate(&db),
		)
		defer lc.RequireStart().RequireStop()

		db.Exec("DELETE FROM ledger")

		testWalletId := "test-wallet-id-e"

		Convey("When create a valid ledger", func() {
			ledgerEntity, err := ledgerentity.NewLedgerEntity(ledgerentity.NewParams{
				WalletId: testWalletId,
				Page:     0,
			})
			So(err, ShouldBeNil)
			createdLedger, err := repo.Create(
				CreateParams{
					Ledger: ledgerEntity,
				},
			)
			So(err, ShouldBeNil)

			Convey("Then I should be able to retrieve the ledger", func() {
				retrievedLedger, err := repo.Get(
					GetParams{
						LedgerId: createdLedger.Id,
					},
				)
				So(err, ShouldBeNil)
				So(retrievedLedger.Id, ShouldEqual, createdLedger.Id)
				So(retrievedLedger.Page, ShouldEqual, createdLedger.Page)
				So(retrievedLedger.CreatedAt, ShouldNotBeNil)
				So(retrievedLedger.UpdatedAt, ShouldNotBeNil)
			})
		})

		Convey("When I create a ledger with entries", func() {
			testCounterpartyId := "test-counterparty-id-"

			ledgerEntity, err := ledgerentity.NewLedgerEntity(ledgerentity.NewParams{
				WalletId: testWalletId,
				Page:     0,
			})
			So(err, ShouldBeNil)

			amt := ledgerentry.Amount{
				SenderCurrency:    "INR",
				RecipientCurrency: "INR",
				AmountSent:        100,
				ExchangeRate:      1,
			}
			createEvt := ledgerentry.HistoryEvent{
				Status:    ledgerentry.Status_CREATED,
				CreatedAt: timestamppb.Now(),
			}
			hist := []*ledgerentry.HistoryEvent{
				&createEvt,
			}
			entry := &ledgerentry.Entry{
				Amount:         &amt,
				IsSender:       true,
				CounterpartyId: testCounterpartyId,
				Type:           ledgerentry.Type_ADS_AWARD,
				Status:         ledgerentry.Status_CREATED,
				History:        hist,
			}
			ledgerEntity.PushEntry(ledgerentity.PushEntryParams{
				Entry: entry,
			})
			So(ledgerEntity.Page.Entries, ShouldHaveLength, 1)

			createdLedger, err := repo.Create(
				CreateParams{
					Ledger: ledgerEntity,
				},
			)
			So(err, ShouldBeNil)

			Convey("Then I should be able to retrieve the ledger with entries", func() {
				retrievedLedger, err := repo.Get(
					GetParams{
						LedgerId: createdLedger.Id,
					},
				)
				So(err, ShouldBeNil)
				So(retrievedLedger.Id, ShouldEqual, createdLedger.Id)
				So(retrievedLedger.Page, ShouldEqual, createdLedger.Page)
				So(retrievedLedger.Page.Entries, ShouldHaveLength, 1)
				retrievedEntry, retrievalErr := retrievedLedger.GetEntry(
					ledgerentity.GetEntryParams{
						Index: 0,
					},
				)
				So(retrievalErr, ShouldBeNil)
				So(proto.Equal(retrievedEntry, entry), ShouldBeTrue)
			})
		})

		Convey("When there is a ledger in the database", func() {
			ledgerEntity, err := ledgerentity.NewLedgerEntity(ledgerentity.NewParams{
				WalletId: testWalletId,
				Page:     0,
			})
			So(err, ShouldBeNil)
			createdLedger, err := repo.Create(
				CreateParams{
					Ledger: ledgerEntity,
				},
			)
			So(err, ShouldBeNil)

			Convey("Then I should be able to Get it", func() {
				retrievedLedger, err := repo.Get(
					GetParams{
						LedgerId: createdLedger.Id,
					},
				)
				So(err, ShouldBeNil)
				So(retrievedLedger.Id, ShouldEqual, createdLedger.Id)
				So(retrievedLedger.Page, ShouldEqual, createdLedger.Page)
				So(retrievedLedger.CreatedAt, ShouldNotBeNil)
				So(retrievedLedger.UpdatedAt, ShouldNotBeNil)
			})
		})
	})
}
