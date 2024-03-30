package uploadstateservice

import (
	"github.com/linxGnu/mssqlx"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

type UploadStateParams struct {
	fx.In
	Logger *zap.Logger
	Db     *mssqlx.DBs
}

type UploadStateService struct {
	Logger *zap.Logger
	Db     *mssqlx.DBs
}

// just initialize of upload service
func NewUploadStateService(params UploadStateParams) *UploadStateService {
	logger := params.Logger.Named("upload_state_service")

	return &UploadStateService{
		Logger: logger,
		Db:     params.Db,
	}
}
