package ledgerrepo

import (
	"time"

	. "github.com/go-jet/jet/postgres"
	"github.com/linxGnu/mssqlx"
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/model"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/table"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgerentity"
	"github.com/wildr-inc/app/teller/pkg/ledger/ledgermarshaller"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type LedgerRepoParams struct {
	fx.In

	Logger     *zap.Logger
	Marshaller *ledgermarshaller.LedgerMarshaller
	Db         *mssqlx.DBs
}

type LedgerRepo struct {
	logger     zap.Logger
	marshaller ledgermarshaller.LedgerMarshaller
	db         *mssqlx.DBs
}

func NewLedgerRepo(
	params LedgerRepoParams,
) *LedgerRepo {
	logger := params.Logger.Named("ledger_repository")
	return &LedgerRepo{
		logger:     *logger,
		marshaller: *params.Marshaller,
		db:         params.Db,
	}
}

type CreateParams struct {
	Ledger ledgerentity.LedgerEntity
}

// Insert ledger to db returns errortypes.MarshallingError if failed to marshal
// ledger page returns errortypes.QueryError if failed to insert ledger
func (repo *LedgerRepo) Create(
	params CreateParams,
) (ledgerentity.LedgerEntity, *errors.GenesisError) {
	repo.logger.Info(
		"creating ledger",
		zap.String("ledger_id", params.Ledger.Id),
		zap.Int("ledger_length", len(params.Ledger.Page.Entries)),
	)

	ledger, err := repo.marshaller.MarshalToDb(ledgermarshaller.MarshalToDbParams{
		Ledger: &params.Ledger,
	})
	if err != nil {
		repo.logger.Error(
			"failed to marshal ledger to db",
			zap.Error(err),
			zap.String("ledger_id", params.Ledger.Id),
		)
		return ledgerentity.LedgerEntity{}, err
	}

	ledger.CreatedAt = time.Now()
	ledger.UpdatedAt = time.Now()

	stmt := table.Ledger.INSERT(
		table.Ledger.ID,
		table.Ledger.Page,
		table.Ledger.CreatedAt,
		table.Ledger.UpdatedAt,
	).MODEL(ledger)

	_, insErr := stmt.Exec(repo.db)
	if insErr != nil {
		repo.logger.Error(
			"failed to insert ledger",
			zap.Error(err),
			zap.String("ledger_id", ledger.ID),
		)
		gError := errors.NewQueryError(errors.QueryErrorParams{
			Error: "failed to insert ledger",
			DebugData: errors.DebugData{
				"error":     insErr.Error(),
				"ledger_id": ledger.ID,
			},
		})
		return ledgerentity.LedgerEntity{}, &gError
	}

	return params.Ledger, nil
}

type GetParams struct {
	LedgerId string
}

// Get ledger from db returns errortypes.QueryError if failed to get ledger
// returns errortypes.MarshallingError if failed to unmarshal ledger page
func (repo *LedgerRepo) Get(
	params GetParams,
) (ledgerentity.LedgerEntity, *errors.GenesisError) {
	repo.logger.Info(
		"getting ledger",
		zap.String("ledger_id", params.LedgerId),
	)

	ledger := &model.Ledger{}
	stmt := table.Ledger.SELECT(
		table.Ledger.ID,
		table.Ledger.Page,
		table.Ledger.CreatedAt,
		table.Ledger.UpdatedAt,
	).WHERE(table.Ledger.ID.EQ(String(params.LedgerId))).LIMIT(1)

	err := stmt.Query(repo.db, ledger)
	if err != nil {
		repo.logger.Error(
			"failed to get ledger",
			zap.Error(err),
			zap.String("ledger_id", params.LedgerId),
		)
		gError := errors.NewQueryError(errors.QueryErrorParams{
			Error: "failed to get ledger",
			DebugData: errors.DebugData{
				"error":     err.Error(),
				"ledger_id": params.LedgerId,
			},
		})
		return ledgerentity.LedgerEntity{}, &gError
	}

	ledgerEntity, marshErr := repo.marshaller.UnmarshalFromDb(
		ledgermarshaller.UnmarshalFromDbParams{
			Ledger: *ledger,
		},
	)
	if marshErr != nil {
		repo.logger.Error(
			"failed to unmarshal ledger from db",
			zap.Error(err),
			zap.String("ledger_id", params.LedgerId),
		)
		return ledgerentity.LedgerEntity{}, marshErr
	}

	return *ledgerEntity, nil
}
