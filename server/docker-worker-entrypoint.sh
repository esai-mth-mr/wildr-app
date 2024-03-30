#!/bin/sh

set -e

echo "Starting in 'prod' mode..."
exec yarn worker:start:prod
