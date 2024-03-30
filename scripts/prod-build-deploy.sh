#!/bin/bash
set -e

cd server
./prod-build-image.sh
cd ..

./prod-troll-server-build.sh

./prod-deploy.sh
