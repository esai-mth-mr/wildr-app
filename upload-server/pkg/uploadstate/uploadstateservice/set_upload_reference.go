package uploadstateservice

import (
	"time"

	. "github.com/go-jet/jet/postgres"
	"github.com/linxGnu/mssqlx"
	"github.com/wildr-inc/app/genesis/pkg/errors"
	"github.com/wildr-inc/app/upload-server/pkg/database/models/upload-server/public/model"
	"github.com/wildr-inc/app/upload-server/pkg/database/models/upload-server/public/table"
	"github.com/wildr-inc/app/upload-server/pkg/uploadstate/uploadstateentity"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type SetUploadReferencedParams struct {
	fx.In
	Db             *mssqlx.DBs
	UploadID       string
	IdempotencyKey string
}

type SetUploadReferenced struct {
	UploadStateEntity uploadstateentity.UploadStateEntity
}

// SetUploadReferenced sets the upload reference state in the database based on the given parameters.
// It is intended to be called when the server makes a request to verify the refs.
//
// Parameters:
//   - params: SetUploadReferencedParams containing the necessary information for setting the upload reference.
//
// Returns:
//   - SetUploadReferenced: A struct containing the updated upload state entity if successful.
//   - *errors.GenesisError: An error type representing various failure scenarios.
//     Possible error types include UpdateUploadReferenceError, UploadNotCompleteError and QueryError.
func (u *UploadStateService) SetUploadReferenced(params *SetUploadReferencedParams) (*SetUploadReferenced, *errors.GenesisError) {
	// Fetch upload state from the database based on UploadID
	uploadState, err := u.fetchUploadState(params.UploadID)
	if err != nil {
		u.Logger.Error(
			"failed to fetch upload state from the database",
			zap.Error(err),
			zap.String("upload_id", params.UploadID),
		)

		gError := NewUpdateUploadReferencedError(UpdateUploadReferenceErrorParams{
			Error:     "failed to set upload reference",
			DebugData: errors.DebugData{"upload_id": params.UploadID},
		})
		return &SetUploadReferenced{}, &gError
	}

	// Check if the upload is already in the "COMPLETE" state
	if uploadState.State != table.StateComplete {
		gError := UploadNotCompleteError(UploadNotCompleteErrorParams{
			Error:     "upload is not in the COMPLETE state",
			DebugData: errors.DebugData{"current state": uploadState.State},
		})
		return &SetUploadReferenced{}, &gError
	}

	// Update the state to StateReferenced
	uploadState.State = table.StateReferenced
	uploadState.UpdatedAt = time.Now()

	updateStmt := table.UploadState.
		UPDATE().
		SET(table.UploadState.State, uploadState.State).
		SET(table.UploadState.UpdatedAt, time.Now()).
		WHERE(table.UploadState.ID.EQ(String(params.UploadID)))

	_, updateErr := updateStmt.Exec(u.Db)
	if updateErr != nil {
		u.Logger.Error("failed to update upload reference", zap.Error(updateErr))

		gError := NewUpdateUploadReferencedError(UpdateUploadReferenceErrorParams{
			Error:     "failed to update upload to referenced.",
			DebugData: errors.DebugData{"upload_id": params.UploadID},
		})
		return &SetUploadReferenced{}, &gError
	}

	// Convert database model to entity model
	uploadStateEntity := u.ToEntityFromDb(uploadState)

	result := &SetUploadReferenced{
		UploadStateEntity: *uploadStateEntity,
	}

	return result, nil
}

func (u *UploadStateService) fetchUploadState(uploadID string) (*model.UploadState, *errors.GenesisError) {
	stmt := table.UploadState.SELECT(table.UploadState.AllColumns).
		WHERE(table.UploadState.ID.EQ(String(uploadID))).
		LIMIT(1)

	uploadState := &model.UploadState{}
	err := stmt.Query(u.Db, uploadState)
	if err != nil {
		u.Logger.Error(
			"failed to fetch upload state from the database",
			zap.Error(err),
			zap.String("upload_id", uploadID),
		)

		queryErr := errors.NewQueryError(errors.QueryErrorParams{
			Error:     err.Error(),
			DebugData: errors.DebugData{"upload_id": uploadID},
		})
		return nil, &queryErr
	}

	return uploadState, nil
}

func (u *UploadStateService) ToEntityFromDb(uploadState *model.UploadState) *uploadstateentity.UploadStateEntity {
	uploadStateEntity := uploadstateentity.UploadStateEntity{
		ID:             uploadState.ID,
		UserID:         uploadState.UserID,
		State:          uploadstateentity.UploadState(uploadState.State),
		IdempotencyKey: uploadState.IdempotencyKey,
		FilePath:       uploadState.FilePath,
		FileType:       uploadState.FileType,
		CheckSum:       uploadState.CheckSum,
		CreatedAt:      uploadState.CreatedAt,
		UpdatedAt:      uploadState.UpdatedAt,
	}
	return &uploadStateEntity
}
