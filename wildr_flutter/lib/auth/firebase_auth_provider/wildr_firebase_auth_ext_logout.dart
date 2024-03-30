part of 'wildr_firebase_auth.dart';

extension WildrFirebaseAuthLogout on WildrFirebaseAuth {
  Future<void> removeFirebaseCredentials() async {
    try {
      print('removeFirebaseCredentials...');
      await disconnectWithGoogleCredentialsIfAny();
      await FirebaseAuth.instance.signOut();
    } catch (exception, stack) {
      await FirebaseCrashlytics.instance.recordError(exception, stack);
      // let the app crash via StackOverflow
      await removeFirebaseCredentials();
    }
  }

  Future<void> disconnectWithGoogleCredentialsIfAny() async {
    try {
      if (checkIfProviderExists(LoginType.GOOGLE)) {
        final GoogleSignIn googleSignIn = GoogleSignIn();
        try {
          await googleSignIn.signOut();
          print('Signed out from Google Sign in');
        } catch (e, stack) {
          print(e);
          await FirebaseCrashlytics.instance.recordError(
            e,
            stack,
            reason: 'Failed to signOut from google sign in',
          );
        }
        try {
          if (googleSignIn.currentUser == null) {
            print('Current user is null');
            return;
          }
          await googleSignIn.disconnect();
          debugPrint('Disconnected successfully');
        } catch (e, stack) {
          print(e);
          await FirebaseCrashlytics.instance.recordError(
            e,
            stack,
            reason: 'Failed to disconnect from google sign in',
          );
        }

        debugPrint('Disconnected Google Sign in');
      } else {
        debugPrint('No need to disconnect from google sign in');
      }
    } catch (exception, stack) {
      await FirebaseCrashlytics.instance.recordError(
        exception,
        stack,
        reason: 'Failed to disconnect from google sign in',
      );
    }
  }
}
