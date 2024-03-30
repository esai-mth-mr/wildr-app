#!/bin/sh

set -e

echo "Starting payment server in 'prod' mode..."
exec yarn start:prod
