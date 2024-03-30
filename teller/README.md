# Teller

Wildr's backend service for tracking user transactions and wallets.

# Getting Started

## Go

### Install Go with asdf

We use asdf to manage our tool versions. Install asdf and the Go plugin:

```bash
brew install asdf
asdf plugin add golang https://github.com/asdf-community/asdf-golang.git
asdf install golang 1.21.5
```

### Add Go to Path

Add the following to your .zshrc or .bashrc

```bash
export PATH=/opt/homebrew/bin:$HOME/go/bin:$HOME/.asdf/installs/golang/1.21.5/packages/bin:$PATH
```

(assuming you are using homebrew as well)

## Dependencies

This project uses Bazel for building and testing, with Gazelle for managing Go
dependencies and generating Bazel build files. Gazelle automates the creation of
BUILD.bazel files for Go packages and can update them as your dependencies
change.

```bash
brew install bazel
```

```bash
go mod download
```

Then update Bazel dependencies using Gazelle:

```bash
make gazelle
```

Note that gazelle can create faulty BUILD.bazel files for protobufs to monitor
these changes closely.

Each time you add a new dependency with `go get`, you should re-run Gazelle to
update the Bazel build files:

```bash
bazel run //:gazelle -- update-repos -from_file=go.mod -to_macro=deps.bzl%go_dependencies
```

You may also need to update the `WORKSPACE` file if you add a dependency that
requires a Bazel rule that is not already included in the `WORKSPACE` file. If
you add a file that is not a Go package, you will need to add it to the
`BUILD.bazel` file for the package that uses it.

## Build and Run

Build the binary:

```bash
make build
```

When builds fail always make sure to try a clean build and make sure to re-run
Gazelle:

```bash
make clean
make gazelle
```

Run the binary:

```bash
make run
```

# Database Setup

## Create Database

Create database with psql (assuming you have the docker-compose.dev.yml running):

```bash
make create_db
```

## Migration

### Create Migration

```bash
make create_migration name=create_users_table
```

### Run All Migrations

```bash
make migrate_up
```

### Rollback All Migrations

```bash
make migrate_down
```

### Migrate Local Db to Remote Schema

```bash
pg_dump -s -U username -h hostname dbname > db/migrations/000000_init_schema.sql
```

```bash
make migrate_up
```

(the migrations dir needs to be empty)

## Generate Models

```bash
make generate_models
```

# Development

## Format

```bash
make fmt
```

## Linting

```bash
make lint
```

# Testing

Test are run via bazel or go test. However bazel is used for CI/CD and is the
source of truth for testing. Bazel requires that test declare their dependencies
so any imported files that are not go packages must be added to `BUILD.bazel`
files. Go files and .proto files are automatically detected and handled by gazelle.

## Setup Test DB

```bash
make create_test_db
```

## Unit Tests

```bash
make test
```

## Coverage

```bash
brew install lcov
make coverage
```

Then open `./coverage/index.html` in your browser to view the coverage report.
