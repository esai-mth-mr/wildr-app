package walletentity

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletregion"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletstatus"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/wallettype"
)

type WalletEntity struct {
	ID             string
	OwnerID        string
	Balances       WalletBalances
	Page           WalletPage
	FirstEntryDate *time.Time
	LastEntryDate  *time.Time
	Metadata       *WalletMetadata
	Type           wallettype.WalletType
	Status         walletstatus.WalletStatus
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type WalletPage struct {
	Entries []string `json:"entries"`
}

const ID_DELIMITER = ':'

type WalletBalances struct {
	Current   int64 `json:"current"`
	Available int64 `json:"available"`
	Pending   int64 `json:"pending"`
}

type WalletMetadata struct {
	PageCount int64 `json:"page_count"`
}

type NewForUserParams struct {
	UserID string
	Region walletregion.WalletRegion
}

func NewForUser(
	params NewForUserParams,
) WalletEntity {
	id := GetWalletId(
		GetWalletIdParams{
			Region:       params.Region,
			UserID:       params.UserID,
			WalletNumber: 0,
		},
	)

	return WalletEntity{
		ID:      id,
		OwnerID: params.UserID,
		Balances: WalletBalances{
			Current:   0,
			Available: 0,
			Pending:   0,
		},
		Page: WalletPage{
			Entries: []string{},
		},
		Metadata: &WalletMetadata{
			PageCount: 0,
		},
		Type:      wallettype.User,
		Status:    walletstatus.Created,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

type NewEmptyForUserParams struct {
	UserID string
	Region walletregion.WalletRegion
}

func NewEmptyForUser(
	params NewEmptyForUserParams,
) WalletEntity {
	wallet := NewForUser(NewForUserParams(params))

	wallet.Status = walletstatus.PreCreation
	return wallet
}

type GetWalletIdParams struct {
	Region       walletregion.WalletRegion
	UserID       string
	WalletNumber uint8
	Page         uint16
}

// Wallet id is 32 bytes long
// 5 byte buffer of _ for future use
// 1 byte separator
// 2 byte region
// 1 byte separator
// 16 byte hash of userId
// 1 byte separator
// 2 byte wallet number
// 1 byte separator
// 3 byte page

func GetWalletId(
	params GetWalletIdParams,
) string {
	idBytes := make([]byte, 32)

	buffer := bytes.Repeat([]byte{'_'}, 5)
	copy(idBytes, buffer)

	idBytes[5] = byte(ID_DELIMITER)
	copy(idBytes[6:], []byte(fmt.Sprintf("%0*d", 2, params.Region)))

	// Using a sha256 hash of the user id to generate a unique id that is also
	// secure.
	idBytes[8] = byte(ID_DELIMITER)
	hash := sha256.Sum256([]byte(params.UserID))
	hashBase64 := base64.StdEncoding.EncodeToString(hash[:32])
	copy(idBytes[9:], []byte(hashBase64[:16]))

	idBytes[25] = byte(ID_DELIMITER)
	copy(idBytes[26:], []byte(fmt.Sprintf("%0*d", 2, params.WalletNumber)))

	idBytes[28] = byte(ID_DELIMITER)
	page := fmt.Sprintf("%0*d", 3, params.Page)
	copy(idBytes[29:], []byte(page))

	return string(idBytes)
}
