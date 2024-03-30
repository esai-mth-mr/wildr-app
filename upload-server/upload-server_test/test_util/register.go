package test_util

import (
	"database/sql"
	"os"
	"sync"

	"github.com/jackc/pgx/v5/stdlib"
	"github.com/ngrok/sqlmw"
)

var once sync.Once

func Register() {
	once.Do(func() {
		os.Setenv("CONFIG_FILE", "../../../config/config_test.yml")
		sql.Register("pg", sqlmw.Driver(stdlib.GetDefaultDriver(), sqlmw.NullInterceptor{}))
	})
}
