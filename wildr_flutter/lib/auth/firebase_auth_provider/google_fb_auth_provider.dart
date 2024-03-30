import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/auth_provider.dart';
import 'package:wildr_flutter/login_signup/user_details.dart';

class IncorrectAccountException implements Exception {
  String message;

  IncorrectAccountException([this.message = 'Incorrect account used']);

  @override
  String toString() => message;
}

class GoogleFBAuthProvider extends AuthProvider {
  @override
  Future<OAuthCredential?> getCredential([String? checkEmail]) async {
    final GoogleSignInAccount? googleUser =
        await GoogleSignIn(scopes: ['email']).signIn().catchError((error) {
      debugPrint('GoogleSingInError $error');
      return null;
    });
    if (googleUser == null) {
      debugPrint('GOOGLE USER = null');
      return null;
    }
    // if user logs in with a different google account throw an exception
    if (checkEmail != null) {
      if (googleUser.email != checkEmail) {
        throw IncorrectAccountException();
      }
    }

    final GoogleSignInAuthentication googleAuth =
        await googleUser.authentication;

    return GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
  }

  Future<Map<String, dynamic>?> getAllDetails() async {
    debugPrint('getAllDetails()');
    final GoogleSignInAccount? googleUser = await getGoogleAuthCredentials();
    if (googleUser == null) {
      debugPrint('GOOGLE USER = null');
      return null;
    }
    try {
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      debugPrint('found googleUser.authentication');
      return {
        'googleUser': googleUser,
        'credentials': GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        ),
      };
    } catch (e) {
      debugPrint('FAILED to find googleUser.authentication');
      debugPrint(e.toString());
      return null;
    }
  }

  Future<GoogleSignInAccount?> getGoogleAuthCredentials() async {
    try {
      debugPrint('getGoogleAuthCredentials()');
      final GoogleSignInAccount? account =
          await GoogleSignIn(scopes: ['email']).signIn();
      return account;
    } catch (error) {
      debugPrint('GoogleSingInError $error');
      return null;
    }
  }

  @override
  Future<UserDetails> signIn([String? checkEmail]) async {
    try {
      final cred = await getCredential(checkEmail);
      if (cred == null) {
        throw Exception('google credentials were null');
      }
      final UserCredential firebaseCred =
          await FirebaseAuth.instance.signInWithCredential(cred);
      return UserDetails(firebaseUser: firebaseCred.user);
    } on FirebaseAuthException catch (e) {
      throw FirebaseAuthException(code: e.code);
    } catch (e) {
      throw Exception(e);
    }
  }
}
