#!/bin/bash
set -e

cd server
./dev-build-image.sh
cd ..

./dev-troll-server-build.sh

./dev-deploy.sh
