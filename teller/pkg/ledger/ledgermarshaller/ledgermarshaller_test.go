package ledgermarshaller

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity/ledgerentry"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestMarshalToDb(t *testing.T) {
	Convey("Given I have a ledger marshaller", t, func() {
		marsh := NewLedgerMarshaller(LedgerMarshallerParams{
			Logger: zap.NewNop(),
		})
		counterpartyId := "counterparty-id-"

		Convey("When I marshal a ledger to the database", func() {
			entry := ledgerentry.Entry{
				Amount: &ledgerentry.Amount{
					SenderCurrency:    "INR",
					RecipientCurrency: "USD",
					AmountSent:        100,
					ExchangeRate:      100000,
				},
				IsSender:       true,
				CounterpartyId: counterpartyId,
				Type:           ledgerentry.Type_ADS_AWARD,
				Status:         ledgerentry.Status_CREATED,
				History: []*ledgerentry.HistoryEvent{
					{
						CreatedAt: timestamppb.Now(),
						Status:    ledgerentry.Status_CREATED,
					},
				},
			}
			marshalledEntry, err := ledgerentity.MarshalLedgerEntry(
				ledgerentity.MarshalLedgerEntryParams{
					Entry: &entry,
				},
			)
			So(err, ShouldBeNil)

			ledger := ledgerentity.LedgerEntity{
				Id: "test-ledger-id",
				Page: ledgerentity.LedgerPage{
					Entries: []string{
						marshalledEntry,
					},
				},
			}
			marshelled, err := marsh.MarshalToDb(MarshalToDbParams{
				Ledger: &ledger,
			})
			So(err, ShouldBeNil)

			Convey("It should unmarshal to the same struct", func() {
				unmarshalled, err := marsh.UnmarshalFromDb(UnmarshalFromDbParams{
					Ledger: *marshelled,
				})
				So(err, ShouldBeNil)
				So(unmarshalled, ShouldNotBeNil)
				So(unmarshalled.Id, ShouldEqual, ledger.Id)
				So(unmarshalled.Page, ShouldNotBeNil)
				So(len(unmarshalled.Page.Entries), ShouldEqual, 1)
				So(unmarshalled.CreatedAt, ShouldHappenOnOrAfter, ledger.CreatedAt)
				So(unmarshalled.UpdatedAt, ShouldHappenOnOrAfter, ledger.UpdatedAt)

				Convey("And the entry should be the same", func() {
					unmarshalledEntry, err := unmarshalled.GetEntry(ledgerentity.GetEntryParams{
						Index: 0,
					})
					So(err, ShouldBeNil)
					So(unmarshalledEntry, ShouldNotBeNil)
					isEqual := proto.Equal(unmarshalledEntry, &entry)
					So(isEqual, ShouldBeTrue)
				})
			})
		})
	})
}

func TestUnmarshalFromDb(t *testing.T) {
	Convey("Given I have a ledger marshaller", t, func() {
		marsh := NewLedgerMarshaller(LedgerMarshallerParams{
			Logger: zap.NewNop(),
		})
		counterpartyId := "counterparty-id-"

		Convey("When I unmarshal a ledger from the database", func() {
			entry := ledgerentry.Entry{
				Amount: &ledgerentry.Amount{
					SenderCurrency:    "USD",
					RecipientCurrency: "INR",
					AmountSent:        100,
					ExchangeRate:      10000000,
				},
				IsSender:       true,
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
			marshalledEntry, err := ledgerentity.MarshalLedgerEntry(
				ledgerentity.MarshalLedgerEntryParams{
					Entry: &entry,
				},
			)
			So(err, ShouldBeNil)

			ledger := ledgerentity.LedgerEntity{
				Id: "test-ledger-id",
				Page: ledgerentity.LedgerPage{
					Entries: []string{
						marshalledEntry,
					},
				},
			}
			marshalled, err := marsh.MarshalToDb(MarshalToDbParams{
				Ledger: &ledger,
			})
			So(err, ShouldBeNil)

			Convey("It should unmarshal to the same struct", func() {
				unmarshalled, err := marsh.UnmarshalFromDb(UnmarshalFromDbParams{
					Ledger: *marshalled,
				})
				So(err, ShouldBeNil)
				So(unmarshalled, ShouldNotBeNil)
				So(unmarshalled.Id, ShouldEqual, ledger.Id)
				So(unmarshalled.Page, ShouldNotBeNil)
				So(len(unmarshalled.Page.Entries), ShouldEqual, 1)
				So(unmarshalled.CreatedAt, ShouldHappenOnOrAfter, ledger.CreatedAt)
				So(unmarshalled.UpdatedAt, ShouldHappenOnOrAfter, ledger.UpdatedAt)

				Convey("And the entry should be the same", func() {
					unmarshalledEntry, err := unmarshalled.GetEntry(ledgerentity.GetEntryParams{
						Index: 0,
					})
					So(err, ShouldBeNil)
					So(unmarshalledEntry, ShouldNotBeNil)
					isEqual := proto.Equal(unmarshalledEntry, &entry)
					So(isEqual, ShouldBeTrue)
				})
			})
		})
	})
}
