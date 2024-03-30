.DEFAULT_GOAL := build

.PHONY:fmt
fmt:
	@echo "Running go formatters..."
	@go run github.com/segmentio/golines@latest . -m 80 -w
	@go run mvdan.cc/gofumpt@latest -l -w .

.PHONY:lint
lint:
	@echo "Running linters..."
	@go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run --fix

.PHONY:gazelle
gazelle:
	@echo "Running gazelle..."
	@bazel run //:gazelle -- update -r .

.PHONY:build
build:
	@echo "Building genesis..."
	bazel build //genesis/cmd/genesis:genesis

.PHONY:clean
clean:
	@echo "Cleaning bazel cache..."
	bazel clean --expunge

.PHONY:run
run:
	@echo "Running genesis..."
	bazel run //genesis/cmd/genesis:genesis

.PHONY:test
test:
	@echo "Running tests..."
	bazel test //genesis/pkg/...

.PHONY:coverage
coverage:
	@echo "Running tests with coverage..."
	bazel coverage //genesis/pkg/... //genesis/cmd/...
	find ./bazel-out/ -type f -name "coverage.dat" -print0 | xargs -0 -I {} echo -n "-a {} " | xargs -r lcov -o /tmp/merged_coverage.info
	genhtml -o coverage /tmp/merged_coverage.info

.PHONY:create_migration
create_migration:
	@echo "Creating migration..."
	go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest create -ext sql -dir database/migrations -seq $(name)

.PHONY:migrate_up
migrate_up:
	@echo "Running migrate up..."
	bazel run //genesis/cmd/migrate_up:migrate_up

.PHONY:migrate_down
migrate_down:
	@echo "Running migrate down..."
	bazel run //genesis/cmd/migrate_down:migrate_down

.PHONY:create_db
create_db:
	@echo "Creating database..."
	psql -U postgres -h localhost -U wildr -c "CREATE DATABASE genesis"

.PHONY:drop_db
drop_db:
	@echo "Dropping database..."
	psql -U postgres -h localhost -U wildr -c "DROP DATABASE genesis"

.PHONY:create_test_db
create_test_db:
	@echo "Creating test database..."
	psql -U postgres -h localhost -U wildr -c "CREATE DATABASE genesis_test"

.PHONY:drop_test_db
drop_test_db:
	@echo "Dropping test database..."
	psql -U postgres -h localhost -U wildr -c "DROP DATABASE genesis_test"

.PHONY:migrate_up_test
migrate_up_test:
	@echo "Running migrate up for test..."
	bazel run //genesis/cmd/migrate_up:migrate_up_test

.PHONY:migrate_down_test
migrate_down_test:
	@echo "Running migrate down for test..."
	bazel run //genesis/cmd/migrate_down:migrate_down_test

.PHONY:generate
generate_models:
	@echo "Generating models..."
	go run ./cmd/generate_models/main.go
