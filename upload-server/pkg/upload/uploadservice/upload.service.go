package uploadservice

import (
	"github.com/linxGnu/mssqlx"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

type UploadFileParams struct {
	fx.In
	Logger *zap.Logger
	Db     *mssqlx.DBs
}

type UploadFileService struct {
	Logger *zap.Logger
	Db     *mssqlx.DBs
}

// just initialize of upload service
func NewFileUploadService(params UploadFileParams) *UploadFileService {
	logger := params.Logger.Named("file_upload_state_service")

	return &UploadFileService{
		Logger: logger,
		Db:     params.Db,
	}
}
