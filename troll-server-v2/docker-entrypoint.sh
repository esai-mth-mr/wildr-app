#!/bin/sh

set -e

echo "Starting in 'prod' mode..."
exec yarn server:start:prod
