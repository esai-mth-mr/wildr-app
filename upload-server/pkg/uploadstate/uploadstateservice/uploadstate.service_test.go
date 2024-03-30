package uploadstateservice

import (
	"fmt"
	"testing"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	"github.com/wildr-inc/app/genesis/pkg/cmd"
	"github.com/wildr-inc/app/genesis/pkg/database/sql/pg"
	"github.com/wildr-inc/app/upload-server/pkg/config"
	"github.com/wildr-inc/app/upload-server/pkg/database/models/upload-server/public/model"
	"github.com/wildr-inc/app/upload-server/pkg/database/models/upload-server/public/table"
	"github.com/wildr-inc/app/upload-server/upload-server_test/test_util"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"go.uber.org/zap"
)

type testEnv struct {
	lc                 *fxtest.App
	uploadStateService *UploadStateService
	db                 *sqlx.DB
}

func setup(t *testing.T) testEnv {
	var lc *fxtest.App
	var uploadStateService *UploadStateService
	var db *sqlx.DB

	lc = fxtest.New(t,
		config.Module,
		cmd.Module,
		fx.Provide(pg.Open),
		fx.Provide(zap.NewNop),
		fx.Provide(NewUploadStateService),
		fx.Populate(&uploadStateService),
		fx.Populate(&db),
	)
	lc.RequireStart()

	env := testEnv{
		lc:                 lc,
		uploadStateService: uploadStateService,
		db:                 db,
	}

	return env
}

func cleanupDb(env testEnv) {
	env.db.Exec(
		fmt.Sprintf("DELETE FROM %s", table.UploadState.TableName()),
	)
}

func teardown(env testEnv) {
	cleanupDb(env)
	env.lc.RequireStop()
}

func Test_SetUploadReferenced(t *testing.T) {
	test_util.Register()
	env := setup(t)
	defer teardown(env)

	const (
		testUploadID        = "testUploadID"
		testIdempotencyKey  = "testIdempotencyKey"
		testStateComplete   = 2
		testStateReferenced = 3
	)

	t.Run("should set upload reference successfully", func(t *testing.T) {
		cleanupDb(env)

		uploadState := &model.UploadState{
			ID:             testUploadID,
			UserID:         "testUserID",
			State:          table.StateComplete,
			IdempotencyKey: testIdempotencyKey,
			FilePath:       "/path/to/file",
			FileType:       "image",
			CheckSum:       "abc123",
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		_, insertErr := env.db.Exec(
			"INSERT INTO upload_state (id, user_id, state, idempotency_key, file_path, file_type, check_sum, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			uploadState.ID, uploadState.UserID, uploadState.State, uploadState.IdempotencyKey,
			uploadState.FilePath, uploadState.FileType, uploadState.CheckSum, uploadState.CreatedAt, uploadState.UpdatedAt,
		)
		assert.Nil(t, insertErr)

		setReferenceResult, setReferenceErr := env.uploadStateService.SetUploadReferenced(&SetUploadReferencedParams{
			UploadID:       testUploadID,
			IdempotencyKey: testIdempotencyKey,
		})

		assert.Nil(t, setReferenceErr)

		assert.Equal(t, testUploadID, setReferenceResult.UploadStateEntity.ID)
		assert.Equal(t, "testUserID", setReferenceResult.UploadStateEntity.UserID)
		assert.Equal(t, table.StateReferenced, setReferenceResult.UploadStateEntity.State)

		fetchedState, fetchErr := env.uploadStateService.fetchUploadState(testUploadID)
		assert.Nil(t, fetchErr)
		assert.Equal(t, table.StateReferenced, fetchedState.State)
	})

	t.Run("should handle error when fetching upload state fails", func(t *testing.T) {
		cleanupDb(env)

		_, err := env.uploadStateService.SetUploadReferenced(&SetUploadReferencedParams{
			UploadID:       "non-existent-id",
			IdempotencyKey: testIdempotencyKey,
		})

		assert.NotNil(t, err)
	})

	t.Run("should handle error when upload is not in COMPLETE state", func(t *testing.T) {
		cleanupDb(env)

		_, insertErr := env.db.Exec(
			"INSERT INTO upload_state (id, user_id, state, idempotency_key, file_path, file_type, check_sum, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			testUploadID, "testUserID", table.StateInProgress, testIdempotencyKey,
			"/path/to/file", "image", "abc123", time.Now(), time.Now(),
		)
		assert.Nil(t, insertErr)

		_, err := env.uploadStateService.SetUploadReferenced(&SetUploadReferencedParams{
			UploadID:       testUploadID,
			IdempotencyKey: testIdempotencyKey,
		})

		assert.NotNil(t, err)
	})
}
