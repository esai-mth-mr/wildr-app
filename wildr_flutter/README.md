# Wildr Flutter App

## Installation
We use asdf to pin the Flutter and dart versions of the app

1. Install [ASDF](https://asdf-vm.com/)

`.tool-versions` contains the version of Flutter and Dart used by the app.

2. Install tools including Flutter/Dart
```
asdf install
```

3. Install gems including cocoapods

```
cd ios
bundle install
```

4. Install pods

```
bundle exec pod install
```

## Code Generation

We use `build_runner` to generate parts of code in the app. You should generate code anytime you make changes to the app.

### Watching

To enable code generation, run the following:

```
flutter pub run build_runner watch
```

This will automatically watch for changes when you modify and save the code and generate the files accordingly.

### Debugging

If you're having weird errors with the code generation, you can trigger a fresh start by running the following:

```
flutter pub run build_runner watch --delete-conflicting-outputs
```

This command will trigger a clean start by deleting all existing generated files before regenerating them.

### Run Once

If you prefer to just run code generation once rather than watch for changes, you can use the following command:

```
flutter pub run build_runner build
```

## Build

Refer to the Flutter documentation on deployment for setup and more details:

- [iOS](https://docs.flutter.dev/deployment/ios)
- [Android](https://docs.flutter.dev/deployment/android)


### Firebase App Distribution (Dev)

First, install the [Firebase CLI](https://firebase.google.com/docs/cli) and log in with `firebase login` to upload builds to Firebase app distribution.

To automatically build and upload dev builds to Firebase app distribution, run the following shell script and follow the instructions:

```sh
./dev-firebase-upload.sh
```

### dev build ios

`flutter build ipa --flavor dev -t lib/main_dev.dart --export-method=ad-hoc`

### dev build apk

`flutter build apk --flavor dev -t lib/main_dev.dart`

### prod build ios ipa

`flutter build ipa --flavor prod`

### prod build app bundle

`flutter build appbundle --flavor prod`

### prod build apk

`flutter build apk --flavor prod`

## Android-Specific

### Getting your SHA1/SHA256

To enable Google sign-in/OAuth on dev builds, you need to link your SHA credentials with the Firebase app:

`cd android`

`./gradlew signingReport`

Add the SHA1 and SHA256 under `devDebug` and `devRelease` to the Android project settings on Firebase.

### On android if data persists after running debug/wireless builds

for dev

`adb shell pm clear com.wildr.dev`

`adb uninstall com.wildr.dev`

for prod

`adb shell pm clear com.wildr.app`

`adb uninstall com.wildr.app`

## Env

Create a `.env` file in the root folder (wildr_flutter)

```
LOCAL_SERVER_URL = 'http://127.0.0.1:4000/graphql'
USE_LOCAL_LOGIN=true #if you want to use login without firebase, only works on local machine
```

In case your machine doesn't use the loopback 127.0.0.1 address, to get machine's address:

- MacOS Command `ifconfig | grep "inet "`


## LINTING
To fix all linting issues: `dart fix --apply`

## FAQ

### Xcode 14 archive fix
[Fix](https://stackoverflow.com/a/75937600/8164116)
Update this file:
`./ios/Pods/Target\ Support\ Files/Pods-Runner/Pods-Runner-frameworks.sh`

in L-44, replace `source="$(readlink "${source}")"` with `source="$(readlink -f "${source}")"`

### How do I get setup with VSCode?

Open VSCode and select this directory (wildr_flutter) and things should just work :)

The configuration for VSCode is in `wildr_flutter/.vscode/launch.json`.

### How can I ensure I am running the latest version of Flutter?

Run `flutter doctor` and it will do a health check to ensure everything on your
system is in working order. If needed, it will recommend running `flutter
upgrade` to update the Flutter version.

### My build failed with `No file or variants found for asset: .env.`

Help! My iOS/Xcode build failed with the following error:

```
Target debug_ios_bundle_flutter_assets failed: Exception: Failed to bundle asset files.

Failed to package /Users/vaarnan/dev/app/wildr_flutter.

No file or variants found for asset: .env.
```

Follow instructions on creating an `.env` file above.

### My build failed with `Module 'camera_avfoundation' not found`

Make sure that you started xcode by double clicking the "Runner.xcworkspace" in "wildr_flutter/ios" folder and not "Runner.xcodeproj".

### How do I get the log file from the app?

The logs are stored in the app's [documents
directory](https://pub.dev/documentation/path_provider/latest/path_provider/getApplicationDocumentsDirectory.html).

In Xcode, press Command-Shift-2 to launch "Devices and Simulators". Then select
your device and find Wildr in the `Installed Apps`. There, click the "..." icon
and "Download Container". The file will contain a "Documents" directory with the
app.log.

### How do I write tests for my GraphQL Isolate?

Great idea to put some code under test!

1. TODO: Copy the boilerplate test file and fill in the required fields
1. Write your test code such that dispatches the expected event
1. Enabled verboseLogging for FakeWildrHttpClientProvider
1. Copy the request your test generated
1. Save the request as a file in the test directory of format $request_....txt
1. Get [Altair](https://chromewebstore.google.com/detail/altair-graphql-client/flnheeellpciglgpaodhkhmapeljopja).
1. Use the url: https://wildr-dev-2-new.api.dev.wildr.com/graphql, otherwise be very careful about scrubbing all PII before committing to git
1. Copy xx part in the request
1. Copy yy part to the response
1. Setup the requestResponseFiles
1. Setup the requestFileNames for a given test
