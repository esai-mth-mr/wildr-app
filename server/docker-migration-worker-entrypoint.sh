#!/bin/sh

set -e

echo "Started app app DB migrations..."
yarn migration:prod:run
echo "Done running app DB migrations"
