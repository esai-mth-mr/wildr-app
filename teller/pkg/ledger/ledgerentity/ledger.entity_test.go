package ledgerentity

import (
	"testing"
	"time"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity/ledgerentry"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestNewLedgerEntityId(t *testing.T) {
	Convey("Given a wallet entity id and page", t, func() {
		walletId := "_____:00:jealcweewcwersrg:00:000"
		Convey("When an id is created", func() {
			id, err := newId(NewIdParams{
				WalletId: walletId,
				Page:     0,
			})
			So(err, ShouldBeNil)
			Convey("It should have the expected format", func() {
				So(id, ShouldNotBeNil)
				So(id, ShouldEqual, "_____:00:jealcweewcwersrg:000000")
			})
		})
	})
}

func TestNewLedgerEntity(t *testing.T) {
	Convey("Given a wallet id and a page", t, func() {
		walletId := "_____:00:jealcweewcwersrg:00:000"
		Convey("When a ledger entity is created", func() {
			before := time.Now().Add(-1 * time.Second)
			ledger, err := NewLedgerEntity(NewParams{
				WalletId: walletId,
				Page:     0,
			})
			after := time.Now()
			So(err, ShouldBeNil)
			Convey("An empty ledger with valid id should be returned", func() {
				So(ledger, ShouldNotBeNil)
				So(ledger.Id, ShouldNotBeEmpty)
				So(ledger.Id, ShouldEqual, "_____:00:jealcweewcwersrg:000000")
				So(ledger.Page, ShouldNotBeNil)
				So(len(ledger.Page.Entries), ShouldEqual, 0)
				So(ledger.CreatedAt, ShouldHappenBetween, before, after)
				So(ledger.UpdatedAt, ShouldHappenBetween, before, after)
			})
		})
	})
}

func TestGetEntry(t *testing.T) {
	Convey("Given a ledger entity", t, func() {
		ledger, _ := NewLedgerEntity(NewParams{
			WalletId: "_____:00:jealcweewcwersrg:00:000",
			Page:     0,
		})
		counterpartyId := "counterparty-id-"

		Convey("When a ledger entry is pushed", func() {
			entry := &ledgerentry.Entry{
				Amount: &ledgerentry.Amount{
					RecipientCurrency: "INR",
					SenderCurrency:    "INR",
					AmountSent:        100,
					ExchangeRate:      1,
				},
				CounterpartyId: counterpartyId,
				Type:           ledgerentry.Type_ADS_AWARD,
				Status:         ledgerentry.Status_CREATED,
				History: []*ledgerentry.HistoryEvent{
					{
						Status:    ledgerentry.Status_CREATED,
						CreatedAt: timestamppb.Now(),
					},
				},
			}
			err := ledger.PushEntry(PushEntryParams{
				Entry: entry,
			})
			So(err, ShouldBeNil)

			Convey("The entry should be retrievable", func() {
				retrievedEntry, err := ledger.GetEntry(GetEntryParams{
					Index: 0,
				})
				retrievedEntry.CounterpartyId = counterpartyId
				So(err, ShouldBeNil)
				So(retrievedEntry, ShouldNotBeNil)
				isEqual := proto.Equal(retrievedEntry, entry)
				if !isEqual {
					t.Errorf("retrieved entry is not equal to pushed entry")
				}
			})
		})
	})
}

func TestPushEntry(t *testing.T) {
	Convey("Given a ledger entity", t, func() {
		ledger, _ := NewLedgerEntity(NewParams{
			WalletId: "_____:00:jealcweewcwersrg:00:000",
			Page:     0,
		})
		counterpartyId := "counterparty-id-"

		Convey("When a ledger entry is pushed", func() {
			entry := &ledgerentry.Entry{
				Amount: &ledgerentry.Amount{
					RecipientCurrency: "INR",
					SenderCurrency:    "INR",
					AmountSent:        100,
					ExchangeRate:      1,
				},
				CounterpartyId: counterpartyId,
				Type:           ledgerentry.Type_ADS_AWARD,
				Status:         ledgerentry.Status_CREATED,
				History: []*ledgerentry.HistoryEvent{
					{
						Status:    ledgerentry.Status_CREATED,
						CreatedAt: timestamppb.Now(),
					},
				},
			}
			err := ledger.PushEntry(PushEntryParams{
				Entry: entry,
			})
			So(err, ShouldBeNil)

			Convey("It should be added to the ledger", func() {
				So(len(ledger.Page.Entries), ShouldEqual, 1)
				e, err := ledger.GetEntry(GetEntryParams{
					Index: 0,
				})

				So(err, ShouldBeNil)
				So(e, ShouldNotBeNil)
				isEqual := proto.Equal(e, entry)

				if !isEqual {
					t.Errorf("created entry is not equal to pushed entry")
				}
			})
		})
	})
}
