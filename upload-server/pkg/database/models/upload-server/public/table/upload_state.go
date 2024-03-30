package table

import (
	"github.com/go-jet/jet/postgres"
)

var UploadState = newUploadStateTable()

const (
	StateInProgress = 1
	StateComplete   = 2
	StateReferenced = 3
)

type uploadStateTable struct {
	postgres.Table

	// Columns
	ID             postgres.ColumnString
	UserID         postgres.ColumnString
	State          postgres.ColumnInteger
	IdempotencyKey postgres.ColumnString
	FilePath       postgres.ColumnString
	FileType       postgres.ColumnString
	CheckSum       postgres.ColumnString
	CreatedAt      postgres.ColumnTimestamp
	UpdatedAt      postgres.ColumnTimestamp
	AllColumns     postgres.ColumnList
	MutableColumns postgres.ColumnList
}

type UploadStateTable struct {
	uploadStateTable

	EXCLUDED uploadStateTable
}

// AS creates new UploadStateTable with assigned alias
func (a *UploadStateTable) AS(alias string) *UploadStateTable {
	aliasTable := newUploadStateTable()
	aliasTable.Table.AS(alias)
	return aliasTable
}

func newUploadStateTable() *UploadStateTable {
	return &UploadStateTable{
		uploadStateTable: newUploadStateTableImpl("public", "upload_state"),
		EXCLUDED:         newUploadStateTableImpl("", "excluded"),
	}
}

func newUploadStateTableImpl(schemaName, tableName string) uploadStateTable {
	var (
		IDColumn             = postgres.StringColumn("id")
		UserIDColumn         = postgres.StringColumn("user_id")
		StateColumn          = postgres.IntegerColumn("state")
		IdempotencyKeyColumn = postgres.StringColumn("idempotency_key")
		FilePathColumn       = postgres.StringColumn("file_path")
		FileTypeColumn       = postgres.StringColumn("file_type")
		CheckSumColumn       = postgres.StringColumn("check_sum")
		CreatedAtColumn      = postgres.TimestampColumn("created_at")
		UpdatedAtColumn      = postgres.TimestampColumn("updated_at")
		allColumns           = postgres.ColumnList{IDColumn, UserIDColumn, StateColumn, FilePathColumn, FileTypeColumn, CheckSumColumn, CreatedAtColumn, UpdatedAtColumn}
		mutableColumns       = postgres.ColumnList{UserIDColumn, StateColumn, IdempotencyKeyColumn, FilePathColumn, FileTypeColumn, CheckSumColumn, CreatedAtColumn, UpdatedAtColumn}
	)

	return uploadStateTable{
		Table: postgres.NewTable(schemaName, tableName, allColumns...),

		// Columns
		ID:             IDColumn,
		UserID:         UserIDColumn,
		State:          StateColumn,
		IdempotencyKey: IdempotencyKeyColumn,
		FilePath:       FilePathColumn,
		FileType:       FileTypeColumn,
		CheckSum:       CheckSumColumn,
		CreatedAt:      CreatedAtColumn,
		UpdatedAt:      UpdatedAtColumn,
		AllColumns:     allColumns,
		MutableColumns: mutableColumns,
	}
}
