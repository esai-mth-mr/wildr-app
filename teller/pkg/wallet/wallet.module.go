package wallet

import (
	"github.com/wildr-inc/app/teller/pkg/wallet/walletmarshaller"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletrepo"
	"github.com/wildr-inc/app/teller/pkg/wallet/walletservice"
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(walletmarshaller.NewWalletMarshaller),
	fx.Provide(walletrepo.NewWalletRepo),
	fx.Provide(walletservice.NewWalletService),
)
