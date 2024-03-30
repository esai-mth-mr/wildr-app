read -p 'EZ mode? (y/n): ' ez_mode

if [ "$ez_mode" == "y" ]; then
  # Read the version line from the pubspec.yaml file
  version_line=$(grep "^version:" pubspec.yaml)

  # Extract the version number using cut
  version=$(echo $version_line | cut -d ' ' -f 2)

  # Split the version into version_number and build_number using '+'
  version_number=$(echo "$version" | cut -d '+' -f 1)
  build_number=$(echo "$version" | cut -d '+' -f 2)

  # Print the version_number and build_number
  echo "Version Name: $version_number"
  echo "Version Code: $build_number"

  distribute_all="y"
  release_notes="release $version_number build $build_number"
  include_android="y"
  include_ios="y"
else
  read -p "Enter version number (e.g., 1.0.0): " version_number
  read -p "Enter build number (e.g., 1): " build_number
  read -p "Enter release notes: " release_notes
  read -p "Include Android? (y/n): " include_android
  read -p "Include iOS? (y/n): " include_ios
  read -p "should distribute to everyone (y/n) " distribute_all
fi

if [ "$distribute_all" == "y" ]; then
  echo 'Distributing to all'
  FIREBASE_GROUP="WildrTeam"
else
  echo "Not including yourself in the testers group."
  FIREBASE_GROUP="qa-team"
fi

RELEASE_NOTES="$release_notes"
echo "\033[0;32mRelease notes: $RELEASE_NOTES\033[0m"

echo "Building for Firebase app distribution for $FIREBASE_GROUP"

if [ "$include_android" == "y" ]; then
  echo "Building dev Android..."
  flutter build apk --flavor dev -t lib/main_dev.dart --build-name=$version_number --build-number=$build_number
  echo "Uploading to dev Android to Firebase $FIREBASE_GROUP"
  firebase appdistribution:distribute ./build/app/outputs/flutter-apk/app-dev-release.apk \
    --app 1:868345598504:android:3f13d07fcdc6a7c13e1b1d \
    --release-notes "$RELEASE_NOTES" \
    --groups "$FIREBASE_GROUP"
fi

if [ "$include_ios" == "y" ]; then
  echo "Building dev iOS..."
  flutter build ipa --flavor dev -t lib/main_dev.dart --export-method=ad-hoc --build-name=$version_number --build-number=$build_number
  echo "Uploading to dev iOS to Firebase $FIREBASE_GROUP"
  firebase appdistribution:distribute ./build/ios/ipa/Wildr.ipa \
    --app 1:868345598504:ios:8ee2023d094a1d393e1b1d \
    --release-notes "$RELEASE_NOTES" \
    --groups "$FIREBASE_GROUP"
fi

echo "🎉 Done building and uploading for dev! 🎉"
