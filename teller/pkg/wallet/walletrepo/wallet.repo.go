package walletrepo

import (
	"time"

	. "github.com/go-jet/jet/postgres"
	"github.com/linxGnu/mssqlx"
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/model"
	"github.com/wildr-inc/app/teller/pkg/database/models/teller/public/table"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletmarshaller"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type WalletRepoParams struct {
	fx.In

	Logger     *zap.Logger
	Marshaller *walletmarshaller.WalletMarshaller
	Db         *mssqlx.DBs
}

type WalletRepo struct {
	Logger     zap.Logger
	Marshaller walletmarshaller.WalletMarshaller
	Db         *mssqlx.DBs
}

func NewWalletRepo(
	params WalletRepoParams,
) *WalletRepo {
	logger := params.Logger.Named("wallet_repository")
	return &WalletRepo{
		Logger:     *logger,
		Marshaller: *params.Marshaller,
		Db:         params.Db,
	}
}

type CreateParams struct {
	Wallet walletentity.WalletEntity
}

// Insert wallet to db
func (repo *WalletRepo) Create(
	params CreateParams,
) (walletentity.WalletEntity, error) {
	wallet, err := repo.Marshaller.MarshalToDb(walletmarshaller.MarshalToDbParams{
		Wallet: &params.Wallet,
	})
	if err != nil {
		repo.Logger.Error(
			"failed to marshal wallet to db",
			zap.Error(err),
			zap.String("wallet_id", params.Wallet.ID),
			zap.String("user_id", params.Wallet.OwnerID),
		)
		return walletentity.WalletEntity{}, err
	}

	wallet.UpdatedAt = time.Now()
	wallet.CreatedAt = time.Now()
	stmt := table.Wallet.INSERT(table.Wallet.AllColumns).MODEL(wallet)

	_, exErr := stmt.Exec(repo.Db)
	if exErr != nil {
		repo.Logger.Error("failed to create wallet", zap.Error(exErr))
		return walletentity.WalletEntity{}, exErr
	}

	newWallet, err := repo.Marshaller.UnmarshalFromDb(walletmarshaller.UnmarshalFromDbParams{
		Wallet: *wallet,
	})

	if err != nil {
		repo.Logger.Error("failed to unmarshal created wallet", zap.Error(err))
		return walletentity.WalletEntity{}, err
	}

	return *newWallet, nil
}

type GetParams struct {
	WalletID string
}

// Get wallet from db returns `errortypes.WalletNotFoundError` if wallet is not
// found, `errortypes.QueryError` if query fails, and
// `errortypes.WalletUnmarshalError` if unmarshalling fails,
func (repo *WalletRepo) Get(
	params GetParams,
) (*walletentity.WalletEntity, *errors.GenesisError) {
	stmt := table.Wallet.SELECT(table.Wallet.AllColumns).WHERE(
		table.Wallet.ID.EQ(String(params.WalletID)),
	).LIMIT(1)

	wallet := &model.Wallet{}
	err := stmt.Query(repo.Db, wallet)
	if err != nil {
		repo.Logger.Error(
			"failed to get wallet",
			zap.Error(err),
			zap.String("wallet_id", params.WalletID),
		)
		if err.Error() == "qrm: no rows in result set" {
			notFoundError := NewWalletNotFoundError(WalletNotFoundErrorParams{
				DebugData: errors.DebugData{"wallet_id": params.WalletID},
			})
			return nil, &notFoundError
		}
		queryErr := errors.NewQueryError(errors.QueryErrorParams{
			Error:     err.Error(),
			DebugData: errors.DebugData{"wallet_id": params.WalletID},
		})
		return nil, &queryErr
	}

	walletEntity, unmarshErr := repo.Marshaller.UnmarshalFromDb(
		walletmarshaller.UnmarshalFromDbParams{
			Wallet: *wallet,
		},
	)
	if unmarshErr != nil {
		repo.Logger.Error(
			"failed to unmarshal wallet from db",
			zap.Error(unmarshErr),
			zap.Any("wallet_id", params.WalletID),
		)
		return nil, unmarshErr
	}

	return walletEntity, nil
}
