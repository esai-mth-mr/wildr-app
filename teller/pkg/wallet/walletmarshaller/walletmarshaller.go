package walletmarshaller

import (
	"encoding/json"

	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/model"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletstatus"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/wallettype"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type WalletMarshallerParams struct {
	fx.In

	Logger *zap.Logger
}

type WalletMarshaller struct {
	Logger zap.Logger
}

func NewWalletMarshaller(
	params WalletMarshallerParams,
) *WalletMarshaller {
	logger := params.Logger.Named("wallet_marshaller")
	return &WalletMarshaller{
		Logger: *logger,
	}
}

type UnmarshalFromDbParams struct {
	Wallet model.Wallet
}

// UnmarshalFromDb unmarshals a wallet from the database. It returns
// errortypes.WalletUnmarshalError if it fails.
func (marsh *WalletMarshaller) UnmarshalFromDb(
	params UnmarshalFromDbParams,
) (*walletentity.WalletEntity, *errors.GenesisError) {
	metadata := walletentity.WalletMetadata{}
	if params.Wallet.Metadata != nil {
		error := json.Unmarshal([]byte(*params.Wallet.Metadata), &metadata)
		if error != nil {
			marsh.Logger.Error(
				"failed to unmarshal wallet metadata",
				zap.Error(error),
				zap.String("wallet_metadata", *params.Wallet.Metadata),
			)
			gError := NewWalletUnmarshalError(WalletUnmarshalErrorParams{
				Error:     "failed to unmarshal wallet metadata",
				DebugData: errors.DebugData{"wallet_metadata": *params.Wallet.Metadata},
			})
			return nil, &gError
		}
	}

	balances := walletentity.WalletBalances{}
	error := json.Unmarshal([]byte(params.Wallet.Balances), &balances)
	if error != nil {
		marsh.Logger.Error("failed to unmarshal wallet balances", zap.Error(error))
		gError := NewWalletUnmarshalError(WalletUnmarshalErrorParams{
			Error:     "failed to unmarshal wallet balances",
			DebugData: errors.DebugData{"wallet_balances": params.Wallet.Balances},
		})
		return nil, &gError
	}

	page := walletentity.WalletPage{}
	error = json.Unmarshal([]byte(params.Wallet.Page), &page)
	if error != nil {
		marsh.Logger.Error("failed to unmarshal wallet entries", zap.Error(error))
		gError := NewWalletUnmarshalError(WalletUnmarshalErrorParams{
			Error:     "failed to unmarshal wallet entries",
			DebugData: errors.DebugData{"wallet_id": params.Wallet.ID},
		})
		return nil, &gError
	}

	return &walletentity.WalletEntity{
		ID:             params.Wallet.ID,
		OwnerID:        params.Wallet.OwnerID,
		Balances:       balances,
		Page:           page,
		FirstEntryDate: params.Wallet.FirstEntryDate,
		LastEntryDate:  params.Wallet.LastEntryDate,
		Metadata:       &metadata,
		Type:           wallettype.WalletType(params.Wallet.Type),
		Status:         walletstatus.WalletStatus(params.Wallet.Status),
		CreatedAt:      params.Wallet.CreatedAt,
		UpdatedAt:      params.Wallet.UpdatedAt,
	}, nil
}

type MarshalToDbParams struct {
	Wallet *walletentity.WalletEntity
}

// MarshalToDb marshals a wallet to the database. It returns
// errortypes.WalletMarshalError if it fails.
func (marsh *WalletMarshaller) MarshalToDb(
	params MarshalToDbParams,
) (*model.Wallet, *errors.GenesisError) {
	wallet := params.Wallet

	if wallet == nil {
		marsh.Logger.Error("failed to marshal wallet: wallet is nil")
		gError := NewWalletMarshalError(WalletMarshalErrorParams{
			Error:     "wallet is nil",
			DebugData: errors.DebugData{"wallet": wallet},
		})
		return nil, &gError
	}

	balances, error := json.Marshal(wallet.Balances)
	if error != nil {
		marsh.Logger.Error("failed to marshal wallet balances", zap.Error(error))
		gError := NewWalletMarshalError(WalletMarshalErrorParams{
			Error:     "failed to marshal wallet balances",
			DebugData: errors.DebugData{"wallet_balances": wallet.Balances},
		})
		return nil, &gError
	}

	page, error := json.Marshal(wallet.Page)
	if error != nil {
		marsh.Logger.Error("failed to marshal wallet entries", zap.Error(error))
		gError := NewWalletMarshalError(WalletMarshalErrorParams{
			Error:     "failed to marshal wallet entries",
			DebugData: errors.DebugData{"wallet_entries": wallet.Page},
		})
		return nil, &gError
	}

	metadata, error := json.Marshal(wallet.Metadata)
	if error != nil {
		marsh.Logger.Error("failed to marshal wallet metadata", zap.Error(error))
		gError := NewWalletMarshalError(WalletMarshalErrorParams{
			Error:     "failed to marshal wallet metadata",
			DebugData: errors.DebugData{"wallet_metadata": wallet.Metadata},
		})
		return nil, &gError
	}
	metaString := string(metadata)

	if wallet.FirstEntryDate != nil {
		first := wallet.FirstEntryDate.UTC()
		wallet.FirstEntryDate = &first
	}

	if wallet.LastEntryDate != nil {
		last := wallet.LastEntryDate.UTC()
		wallet.LastEntryDate = &last
	}

	return &model.Wallet{
		ID:             wallet.ID,
		OwnerID:        wallet.OwnerID,
		Balances:       string(balances),
		Page:           string(page),
		FirstEntryDate: wallet.FirstEntryDate,
		LastEntryDate:  wallet.LastEntryDate,
		Metadata:       &metaString,
		Type:           int16(wallet.Type),
		Status:         int16(wallet.Status),
		CreatedAt:      wallet.CreatedAt,
		UpdatedAt:      wallet.UpdatedAt,
	}, nil
}
