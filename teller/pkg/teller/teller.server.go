package teller

import (
	"context"

	"github.com/wildr-inc/app/genesis/pkg/transport/grpc"
	"github.com/wildr-inc/app/teller/pkg/exchangerate"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletentity"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletservice"
	tellerpb "github.com/wildr-inc/app/teller/proto/teller"
	walletpb "github.com/wildr-inc/app/teller/proto/wallet"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"google.golang.org/grpc/status"
)

type TellerServer struct {
	tellerpb.UnimplementedTellerServer

	logger   *zap.Logger
	wallet   *walletservice.WalletService
	exchange *exchangerate.ExchangeRateService
}

type TellerServiceParams struct {
	fx.In

	Logger   *zap.Logger
	Wallet   *walletservice.WalletService
	Exchange *exchangerate.ExchangeRateService
}

func NewTellerService(params TellerServiceParams) (*TellerServer, error) {
	logger := params.Logger.Named("teller_service")
	return &TellerServer{
		logger:   logger,
		wallet:   params.Wallet,
		exchange: params.Exchange,
	}, nil
}

func (s *TellerServer) RetrieveWallet(
	ctx context.Context,
	req *tellerpb.RetrieveWalletRequest,
) (*tellerpb.RetrieveWalletResponse, error) {
	userId := req.UserId

	wallet, err := s.wallet.GetForUser(walletservice.GetForUserParams{
		UserID: userId,
	})
	if err != nil {
		s.logger.Error(
			"failed to get wallet for user",
			zap.Error(err),
			zap.String("user_id", userId),
		)
		return nil, status.Error(err.Code(), err.Error())
	}

	return &tellerpb.RetrieveWalletResponse{
		Wallet: walletEntityToMessage(wallet),
	}, nil
}

func walletEntityToMessage(wallet *walletentity.WalletEntity) *walletpb.Wallet {
	return &walletpb.Wallet{
		Id:     wallet.ID,
		UserId: wallet.OwnerID,
		Balances: &walletpb.Balances{
			Current:   wallet.Balances.Current,
			Available: wallet.Balances.Available,
			Pending:   wallet.Balances.Pending,
		},
		Status: walletpb.Status(wallet.Status),
	}
}

func (s *TellerServer) GetExchangeRate(
	ctx context.Context,
	req *tellerpb.GetExchangeRateRequest,
) (*tellerpb.GetExchangeRateResponse, error) {
	rate, err := s.exchange.GetRate(exchangerate.GetRateParams{Currency: req.Currency})
	if err != nil {
		s.logger.Error(
			"failed to get exchange rate",
			zap.Error(err),
		)
		return nil, status.Error(err.Code(), err.Error())
	}

	return &tellerpb.GetExchangeRateResponse{
		ExchangeRate: rate,
	}, nil
}

func Register(srv *grpc.Server, svc *TellerServer) {
	tellerpb.RegisterTellerServer(srv.Server, svc)
}
