package ledgermarshaller

import (
	"encoding/json"

	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/model"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type LedgerMarshallerParams struct {
	fx.In

	Logger *zap.Logger
}

type LedgerMarshaller struct {
	Logger zap.Logger
}

func NewLedgerMarshaller(
	params LedgerMarshallerParams,
) *LedgerMarshaller {
	logger := params.Logger.Named("ledger_marshaller")
	return &LedgerMarshaller{
		Logger: *logger,
	}
}

type MarshalToDbParams struct {
	Ledger *ledgerentity.LedgerEntity
}

func (marsh *LedgerMarshaller) MarshalToDb(
	param MarshalToDbParams,
) (*model.Ledger, *errors.GenesisError) {
	pageBytes, err := json.Marshal(param.Ledger.Page)
	pageString := string(pageBytes)
	if err != nil {
		marsh.Logger.Error(
			"failed to marshal ledger page",
			zap.Error(err),
			zap.String("ledger_id", param.Ledger.Id),
		)
		gError := errors.NewMarshallingError(errors.MarshallingErrorParams{
			Error: "failed to marshal ledger page",
			DebugData: errors.DebugData{
				"error":     err.Error(),
				"ledger_id": param.Ledger.Id,
			},
		})
		return nil, &gError
	}

	return &model.Ledger{
		ID:        param.Ledger.Id,
		Page:      &pageString,
		CreatedAt: param.Ledger.CreatedAt,
		UpdatedAt: param.Ledger.UpdatedAt,
	}, nil
}

type UnmarshalFromDbParams struct {
	Ledger model.Ledger
}

func (marsh *LedgerMarshaller) UnmarshalFromDb(
	param UnmarshalFromDbParams,
) (*ledgerentity.LedgerEntity, *errors.GenesisError) {
	page := ledgerentity.LedgerPage{}
	err := json.Unmarshal([]byte(*param.Ledger.Page), &page)
	if err != nil {
		marsh.Logger.Error(
			"failed to unmarshal ledger page",
			zap.Error(err),
			zap.String("ledger_id", param.Ledger.ID),
			zap.Int("ledger_entry_count", len(page.Entries)),
		)
		gError := errors.NewMarshallingError(errors.MarshallingErrorParams{
			Error: "failed to unmarshal ledger page",
			DebugData: errors.DebugData{
				"error":     err.Error(),
				"ledger_id": param.Ledger.ID,
			},
		})
		return nil, &gError
	}

	return &ledgerentity.LedgerEntity{
		Id:        param.Ledger.ID,
		Page:      ledgerentity.LedgerPage{Entries: page.Entries},
		CreatedAt: param.Ledger.CreatedAt,
		UpdatedAt: param.Ledger.UpdatedAt,
	}, nil
}
