package walletentity

import (
	"strings"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletregion"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletstatus"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/wallettype"
)

func TestNewWalletEntityForUser(t *testing.T) {
	Convey("When I call NewWalletEntityForUser", t, func() {
		wallet := NewForUser(
			NewForUserParams{
				UserID: "test-user-id",
				Region: walletregion.UnitedStates,
			},
		)
		Convey("I should have a wallet", func() {
			So(wallet, ShouldNotBeNil)
			So(wallet.ID, ShouldNotBeEmpty)
			So(wallet.OwnerID, ShouldEqual, "test-user-id")
			So(wallet.Balances, ShouldNotBeNil)
			So(wallet.Balances, ShouldEqual, WalletBalances{
				Current:   0,
				Available: 0,
				Pending:   0,
			})
			So(wallet.Page.Entries, ShouldNotBeNil)
			So(len(wallet.Page.Entries), ShouldEqual, 0)
			So(wallet.Metadata, ShouldNotBeNil)
			So(wallet.Metadata, ShouldEqual, &WalletMetadata{
				PageCount: 0,
			})
			So(wallet.Type, ShouldEqual, wallettype.User)
			So(wallet.Status, ShouldEqual, walletstatus.Created)
			So(wallet.CreatedAt, ShouldNotBeNil)
			So(wallet.UpdatedAt, ShouldNotBeNil)
		})
	})
}

func TestNewEmptyWalletForUser(t *testing.T) {
	Convey("When I call NewEmptyWalletForUser", t, func() {
		wallet := NewEmptyForUser(
			NewEmptyForUserParams{
				UserID: "test-user-ideeee",
			},
		)
		Convey("I should have a wallet", func() {
			So(wallet, ShouldNotBeNil)
			So(wallet.ID, ShouldNotBeEmpty)
			So(wallet.OwnerID, ShouldEqual, "test-user-ideeee")
			So(wallet.Balances, ShouldNotBeNil)
			So(wallet.Balances, ShouldEqual, WalletBalances{
				Current:   0,
				Available: 0,
				Pending:   0,
			})
			So(wallet.Page.Entries, ShouldNotBeNil)
			So(len(wallet.Page.Entries), ShouldEqual, 0)
			So(wallet.Metadata, ShouldNotBeNil)
			So(wallet.Metadata, ShouldEqual, &WalletMetadata{
				PageCount: 0,
			})
			So(wallet.Type, ShouldEqual, wallettype.User)
			So(wallet.Status, ShouldEqual, walletstatus.PreCreation)
			So(wallet.CreatedAt, ShouldNotBeNil)
			So(wallet.UpdatedAt, ShouldNotBeNil)
		})
	})
}

func TestGetWalletId(t *testing.T) {
	Convey("When I create a new wallet id with a page", t, func() {
		walletId := GetWalletId(
			GetWalletIdParams{Region: walletregion.UnitedStates},
		)

		parts := strings.Split(walletId, string(ID_DELIMITER))

		Convey("I should have an id with separators", func() {
			So(len(parts), ShouldEqual, 5)
			parts := strings.Split(walletId, string(ID_DELIMITER))
			So(parts[1], ShouldEqual, "01")
			So(parts[3], ShouldEqual, "00")
			So(parts[4], ShouldEqual, "000")
			So(len(walletId), ShouldEqual, 32)
		})
	})

	Convey("When I call newWalletId with a page number", t, func() {
		walletId := GetWalletId(
			GetWalletIdParams{Page: 1},
		)

		parts := strings.Split(walletId, string(ID_DELIMITER))

		Convey("I should have an id with separators", func() {
			So(len(parts), ShouldEqual, 5)
			parts := strings.Split(walletId, string(ID_DELIMITER))
			So(parts[1], ShouldEqual, "00")
			So(parts[3], ShouldEqual, "00")
			So(parts[4], ShouldEqual, "001")
			So(len(walletId), ShouldEqual, 32)
		})
	})
}
