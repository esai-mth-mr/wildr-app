package upload

import (
	"github.com/wildr-inc/app/upload-server/pkg/upload/uploadservice"
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(uploadservice.NewFileUploadService),
)
