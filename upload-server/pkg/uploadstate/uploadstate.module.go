package uploadstate

import (
	"github.com/wildr-inc/app/upload-server/pkg/uploadstate/uploadstateservice"
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(uploadstateservice.NewUploadStateService),
)
