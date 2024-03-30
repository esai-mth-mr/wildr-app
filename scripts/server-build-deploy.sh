#!/bin/bash
set -e

cd server
./dev-build-image.sh
cd ..

./dev-deploy.sh
