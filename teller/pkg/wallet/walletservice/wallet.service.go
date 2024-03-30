package walletservice

import (
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/genesis/pkg/errors/errortypes"
	"github.com/wildr-inc/app/genesis/pkg/validator"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity/walletregion"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletrepo"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type WalletService struct {
	Repo      *walletrepo.WalletRepo
	Logger    zap.Logger
	Validator *validator.Validator
}

type WalletServiceParams struct {
	fx.In

	Repo      *walletrepo.WalletRepo
	Logger    *zap.Logger
	Validator *validator.Validator
}

func NewWalletService(
	params WalletServiceParams,
) *WalletService {
	logger := params.Logger.Named("wallet_service")
	return &WalletService{
		Logger:    *logger,
		Repo:      params.Repo,
		Validator: params.Validator,
	}
}

type CreateForUserParams struct {
	UserID string                    `validate:"required,len=16"`
	Region walletregion.WalletRegion `validate:"gte=0,lte=2"`
}

func (s *WalletService) CreateForUser(
	params CreateForUserParams,
) (walletentity.WalletEntity, error) {
	s.Logger.Info("creating wallet for user", zap.String("user_id", params.UserID))

	err := s.Validator.Validate(params)
	if err != nil {
		s.Logger.Error(
			"failed to validate params",
			zap.Error(err),
			zap.String("user_id", params.UserID),
			zap.String("method", "CreateForUser"),
			zap.String("region", string(params.Region)),
		)
		return walletentity.WalletEntity{}, err
	}

	wallet := walletentity.NewForUser(walletentity.NewForUserParams{
		UserID: params.UserID,
		Region: walletregion.India,
	})

	createdWallet, createErr := s.Repo.Create(walletrepo.CreateParams{
		Wallet: wallet,
	})
	if createErr != nil {
		s.Logger.Error(
			"failed to create wallet in db",
			zap.Error(createErr),
			zap.String("method", "CreateForUser"),
			zap.String("user_id", params.UserID),
		)
		return walletentity.WalletEntity{}, createErr
	}

	return createdWallet, nil
}

type GetForUserParams struct {
	UserID string `validate:"required,len=16"`
}

func (s *WalletService) GetForUser(
	params GetForUserParams,
) (*walletentity.WalletEntity, *errors.GenesisError) {
	s.Logger.Info("getting wallet for user", zap.String("user_id", params.UserID))

	err := s.Validator.Validate(params)
	if err != nil {
		s.Logger.Error(
			"failed to validate params",
			zap.String("method", "GetForUser"),
			zap.Error(err),
			zap.String("user_id", params.UserID),
		)
		return nil, err
	}

	walletId := walletentity.GetWalletId(walletentity.GetWalletIdParams{
		Region:       walletregion.India,
		UserID:       params.UserID,
		WalletNumber: 0,
		Page:         0,
	})

	wallet, getErr := s.Repo.Get(walletrepo.GetParams{
		WalletID: walletId,
	})
	if getErr != nil {
		s.Logger.Error(
			"failed to get wallet by user id",
			zap.Error(getErr),
			zap.String("method", "GetForUser"),
			zap.String("user_id", params.UserID),
			zap.String("wallet_id", walletId),
		)
		if !(getErr.Type() == errortypes.WalletNotFoundError) {
			return nil, getErr
		}
		s.Logger.Info("creating empty wallet for user", zap.String("user_id", params.UserID))
		wallet := walletentity.NewEmptyForUser(walletentity.NewEmptyForUserParams{
			UserID: params.UserID,
		})
		return &wallet, nil
	}

	return wallet, nil
}

type GetEmptyWalletForUserParams struct {
	UserID string                    `validate:"required,len=16"`
	Region walletregion.WalletRegion `validate:"gte=0,lte=2"`
}
