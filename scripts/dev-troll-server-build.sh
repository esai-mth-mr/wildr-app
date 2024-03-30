export TROLL_SERVER_IMAGE_TAG=${TROLL_SERVER_IMAGE_TAG:-troll-server}

if [[ $TROLL_SERVER_IMAGE_TAG == "troll-server-v2" ]]
then
  echo "Building troll-server-v2 started..."
  cd troll-server-v2
  ./dev-build-image.sh
  cd ..
  echo "Building troll-server-v2 completed."
else
  echo "Building troll-server started..."
  cd troll-server
  ./dev-build-image.sh
  cd ..
  echo "Building troll-server completed."
fi
