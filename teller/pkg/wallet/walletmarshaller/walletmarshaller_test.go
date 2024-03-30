package walletmarshaller

import (
	"testing"
	"time"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/model"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletstatus"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/wallettype"
	"go.uber.org/zap"
)

func TestWalletMarshaller(t *testing.T) {
	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I unmarshal a valid wallet", func() {
			record := model.Wallet{
				ID:             "id",
				OwnerID:        "user_id",
				Balances:       `{"current": 1, "available": 2, "pending": 3}`,
				Page:           `{ "Entries": ["entry1", "entry2"] }`,
				FirstEntryDate: nil,
				LastEntryDate:  nil,
				Metadata:       nil,
				Type:           int16(wallettype.Internal),
				Status:         int16(walletstatus.Active),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			params := UnmarshalFromDbParams{
				Wallet: record,
			}
			wallet, err := marsh.UnmarshalFromDb(params)

			So(err, ShouldBeNil)

			Convey("I should have a valid wallet", func() {
				So(wallet, ShouldNotBeNil)
				So(wallet.ID, ShouldEqual, record.ID)
				So(wallet.OwnerID, ShouldEqual, record.OwnerID)
				So(wallet.Type, ShouldEqual, wallettype.Internal)
				So(wallet.Status, ShouldEqual, walletstatus.Active)
				So(wallet.Balances.Current, ShouldEqual, 1)
				So(wallet.Balances.Available, ShouldEqual, 2)
				So(wallet.Balances.Pending, ShouldEqual, 3)
				So(
					wallet.Page,
					ShouldEqual,
					walletentity.WalletPage{Entries: []string{"entry1", "entry2"}},
				)
			})
		})
	})

	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I try to unmarshal nothing from db", func() {
			params := UnmarshalFromDbParams{}
			_, err := marsh.UnmarshalFromDb(params)

			Convey("Then I should have an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})

	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I unmarshal bad balances", func() {
			record := model.Wallet{
				ID:             "id",
				OwnerID:        "user_id",
				Balances:       `{"current": 1, : 2, "pending": 3}`,
				Page:           `{ "Entries": ["entry1", "entry2"] }`,
				FirstEntryDate: nil,
				LastEntryDate:  nil,
				Metadata:       nil,
				Type:           int16(wallettype.Internal),
				Status:         int16(walletstatus.Active),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			params := UnmarshalFromDbParams{
				Wallet: record,
			}
			_, err := marsh.UnmarshalFromDb(params)

			Convey("Then I should have an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})

	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I unmarshal bad entries", func() {
			record := model.Wallet{
				ID:       "id",
				OwnerID:  "user_id",
				Balances: `{"current": 1, "available": 2, "pending": 3}`,
				// entries missing "Entries" key
				Page:           `{ Entries: ["entry1", "entry2"] }`,
				FirstEntryDate: nil,
				LastEntryDate:  nil,
				Metadata:       nil,
				Type:           int16(wallettype.Internal),
				Status:         int16(walletstatus.Active),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			params := UnmarshalFromDbParams{
				Wallet: record,
			}
			_, err := marsh.UnmarshalFromDb(params)

			Convey("Then I should have an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})

	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I unmarshal bad metadata", func() {
			badMetadata := `{"bad": }`
			record := model.Wallet{
				ID:             "id",
				OwnerID:        "user_id",
				Balances:       `{"current": 1, "available": 2, "pending": 3}`,
				Page:           `{ "Entries": ["entry1", "entry2"] }`,
				FirstEntryDate: nil,
				LastEntryDate:  nil,
				Metadata:       &badMetadata,
				Type:           int16(wallettype.Internal),
				Status:         int16(walletstatus.Active),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			params := UnmarshalFromDbParams{
				Wallet: record,
			}
			_, err := marsh.UnmarshalFromDb(params)

			Convey("Then I should have an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})

	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I have entry dates", func() {
			firstEntryDate := time.Now()
			lastEntryDate := time.Now()
			record := model.Wallet{
				ID:             "id",
				OwnerID:        "user_id",
				Balances:       `{"current": 1, "available": 2, "pending": 3}`,
				Page:           `{ "Entries": ["entry1", "entry2"] }`,
				FirstEntryDate: &firstEntryDate,
				LastEntryDate:  &lastEntryDate,
				Metadata:       nil,
				Type:           3,
				Status:         int16(walletstatus.Active),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			params := UnmarshalFromDbParams{
				Wallet: record,
			}
			wallet, err := marsh.UnmarshalFromDb(params)

			Convey("I should have dates", func() {
				So(err, ShouldBeNil)
				So(*wallet.FirstEntryDate, ShouldEqual, firstEntryDate)
				So(*wallet.LastEntryDate, ShouldEqual, lastEntryDate)
			})
		})
	})
}

func TestWalletMarshaller_MarshalToDb(t *testing.T) {
	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I marshal a valid wallet", func() {
			wallet := walletentity.WalletEntity{
				ID:      "id",
				OwnerID: "user_id",
				Balances: walletentity.WalletBalances{
					Current:   1,
					Available: 2,
					Pending:   3,
				},
				Page:           walletentity.WalletPage{Entries: []string{"entry1", "entry2"}},
				FirstEntryDate: nil,
				LastEntryDate:  nil,
				Metadata:       nil,
				Type:           wallettype.Internal,
				Status:         walletstatus.Active,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			record, err := marsh.MarshalToDb(MarshalToDbParams{
				Wallet: &wallet,
			})

			Convey("I should not see errors", func() {
				So(err, ShouldBeNil)
			})

			Convey("I should have a valid wallet", func() {
				So(record, ShouldNotBeNil)
				So(record.ID, ShouldEqual, wallet.ID)
				So(record.OwnerID, ShouldEqual, wallet.OwnerID)
				So(record.Type, ShouldEqual, int16(wallettype.Internal))
				So(record.Status, ShouldEqual, int16(walletstatus.Active))
				So(record.Balances, ShouldEqual, `{"current":1,"available":2,"pending":3}`)
				So(record.Page, ShouldEqual, `{"entries":["entry1","entry2"]}`)
			})
		})
	})

	Convey("Given I have a wallet marshaller", t, func() {
		logger := zap.NewNop()
		marsh := WalletMarshaller{Logger: *logger}
		Convey("When I try to marshal nothing to db", func() {
			_, err := marsh.MarshalToDb(
				MarshalToDbParams{
					Wallet: nil,
				},
			)

			Convey("Then I should have an error", func() {
				So(err, ShouldNotBeNil)
			})
		})
	})
}
