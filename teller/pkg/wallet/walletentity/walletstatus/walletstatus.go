package walletstatus

type WalletStatus int16

const (
	PreCreation WalletStatus = iota
	Created
	Active
)
