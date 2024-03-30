package ledgerentity

import (
	"encoding/base64"
	"fmt"
	"time"

	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity/ledgerentry"
	"google.golang.org/protobuf/proto"
)

type LedgerEntity struct {
	Id        string
	Page      LedgerPage
	CreatedAt time.Time
	UpdatedAt time.Time
}

type LedgerPage struct {
	// Array of LedgerEntries json encoded, lazily decoded
	Entries []string
}

type NewParams struct {
	WalletId string
	Page     uint32
}

func NewLedgerEntity(
	params NewParams,
) (LedgerEntity, error) {
	id, err := newId(NewIdParams(params))

	if err != nil {
		return LedgerEntity{}, err
	}

	return LedgerEntity{
		Id:        id,
		Page:      LedgerPage{Entries: []string{}},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}, nil
}

type PushEntryParams struct {
	Entry *ledgerentry.Entry
}

func (ledgerEntity *LedgerEntity) PushEntry(
	params PushEntryParams,
) error {
	str, err := MarshalLedgerEntry(MarshalLedgerEntryParams(params))
	if err != nil {
		return err
	}

	ledgerEntity.Page.Entries = append(ledgerEntity.Page.Entries, str)

	return nil
}

type MarshalLedgerEntryParams struct {
	Entry *ledgerentry.Entry
}

func MarshalLedgerEntry(
	params MarshalLedgerEntryParams,
) (string, error) {
	data, err := proto.Marshal(params.Entry)
	if err != nil {
		return "", err
	}
	byteString := base64.StdEncoding.EncodeToString(data)

	return byteString, nil
}

type GetEntryParams struct {
	Index uint16
}

func (ledgerEntity *LedgerEntity) GetEntry(
	param GetEntryParams,
) (*ledgerentry.Entry, error) {
	if param.Index >= uint16(len(ledgerEntity.Page.Entries)) {
		return nil, fmt.Errorf("index out of range")
	}

	entry, err := UnmarshalLedgerEntry(UnmarshalLedgerEntryParams{
		EntryString: ledgerEntity.Page.Entries[param.Index],
	})
	if err != nil {
		return nil, err
	}

	return entry, nil
}

type UnmarshalLedgerEntryParams struct {
	EntryString string
}

func UnmarshalLedgerEntry(
	params UnmarshalLedgerEntryParams,
) (*ledgerentry.Entry, error) {
	data, err := base64.StdEncoding.DecodeString(params.EntryString)
	if err != nil {
		return nil, err
	}

	entry := &ledgerentry.Entry{}
	err = proto.Unmarshal(data, entry)
	if err != nil {
		return nil, err
	}

	return entry, nil
}

type NewIdParams struct {
	// The wallet id is the entire id from a wallet not just the hash
	WalletId string
	Page     uint32
}

// Ledger id is 32 bytes long, same as wallet id but with more bytes allocated
// for page number
// 5 byte buffer of _ for future use
// 1 byte separator
// 2 byte region
// 1 byte separator
// 16 byte hash of userId
// 1 byte separator
// 6 byte page

func newId(
	params NewIdParams,
) (string, error) {
	ledgerIdBytes := []byte(params.WalletId)

	page := fmt.Sprintf("%06d", params.Page)
	pageBytes := []byte(page)

	copy(ledgerIdBytes[len(ledgerIdBytes)-6:], pageBytes)

	return string(ledgerIdBytes), nil
}
