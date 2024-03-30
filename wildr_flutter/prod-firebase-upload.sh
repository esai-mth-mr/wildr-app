read -p "Enter version number (e.g., 1.0.0): " version_number
read -p "Enter build number (e.g., 1): " build_number
read -p "EZ mode? (y/n): " ez_mode

if [ "$ez_mode" == "y" ]; then
  distribute_all="y"
  jira_ticket="release $version_number build $build_number"
  release_notes="release $version_number build $build_number"
  use_fvm="y"
  include_android="y"
  include_ios="y"
else
  read -p "Enter Jira ticket number (used for release notes): " jira_ticket
  read -p "Enter release notes: " release_notes
  read -p "Include Android? (y/n): " include_android
  read -p "Include iOS? (y/n): " include_ios
  read -p "should distribute to everyone (y/n) " distribute_all
  read -p "is using FVM (y/n) " use_fvm
fi


if [ "$distribute_all" == "y" ]; then
  echo 'Distributing to all'
  FIREBASE_GROUP="wildr-team"
else
  echo "Not including yourself in the testers group."
  FIREBASE_GROUP="qa-team"
fi

RELEASE_NOTES="WILDR-$jira_ticket: $release_notes"
echo "\033[0;32mRelease notes: $RELEASE_NOTES\033[0m"

echo "Building for Firebase app distribution for $FIREBASE_GROUP"

if [ "$include_android" == "y" ]; then
  echo "Building prod Android..."
  if [ "$use_fvm" == "y" ]; then
    fvm flutter build apk --flavor prod -t lib/main.dart --build-name=$version_number --build-number=$build_number
  else
    flutter build apk --flavor prod -t lib/main.dart --build-name=$version_number --build-number=$build_number
  fi
  echo "Uploading to prod Android to Firebase $FIREBASE_GROUP"
  firebase appdistribution:distribute ./build/app/outputs/flutter-apk/app-prod-release.apk \
    --app 1:975521959515:android:ae4eba93090136d4bb797e \
    --release-notes "$RELEASE_NOTES" \
    --groups "$FIREBASE_GROUP"
fi

if [ "$include_ios" == "y" ]; then
  echo "Building prod iOS..."
  if [ "$use_fvm" == "y" ]; then
    fvm flutter build ipa --flavor prod -t lib/main.dart --export-method=ad-hoc --build-name=$version_number --build-number=$build_number
  else
    flutter build ipa --flavor prod -t lib/main.dart --export-method=ad-hoc --export-method=ad-hoc --build-name=$version_number --build-number=$build_number
  fi
  echo "Uploading to prod iOS to Firebase $FIREBASE_GROUP"
  firebase appdistribution:distribute ./build/ios/ipa/Wildr.ipa \
    --app 1:975521959515:ios:660a234cfa1d9e6abb797e \
    --release-notes "$RELEASE_NOTES" \
    --groups "$FIREBASE_GROUP"
fi

echo "🎉 Done building and uploading for prod! 🎉"
