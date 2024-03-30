import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/auth_provider.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/user_details.dart';

void print(dynamic message) {
  debugPrint('[AppleFBAuthProvider] $message');
}

class AppleFBAuthProvider extends AuthProvider {
  late AuthorizationCredentialAppleID appleCredentials;

  String sha256OfString(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<AuthorizationCredentialAppleID> getAppleIDCredential(
    String rawNonce,
  ) async =>
      await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: sha256OfString(rawNonce),
      );

  @override
  Future<OAuthCredential?> getCredential([String? checkEmail]) async {
    debugPrint('GetCredential');
    final String rawNonce = generateNonce();
    final appleCred = await getAppleIDCredential(rawNonce);
    debugPrint(
      '''
    APPLE CRED = 
    FAMILY_NAME = ${appleCred.familyName}
    GIVEN NAME = ${appleCred.givenName}
    EMAIL =${appleCred.email}''',
    );
    appleCredentials = appleCred;
    final oAuthCred = OAuthProvider('apple.com').credential(
      idToken: appleCred.identityToken,
      accessToken: appleCred.authorizationCode,
      rawNonce: rawNonce,
    );
    return oAuthCred;
  }

  @override
  Future<UserDetails> signIn() async {
    try {
      final OAuthCredential? cred = await getCredential();
      if (cred == null) {
        throw Exception('apple credentials null');
      }
      final UserCredential userCredentials =
          await FirebaseAuth.instance.signInWithCredential(cred);
      return UserDetails(
        firebaseUser: userCredentials.user,
        email: appleCredentials.email,
        displayName:
            '${appleCredentials.givenName} ${appleCredentials.familyName}',
        signInType: LoginType.APPLE,
      );
    } on FirebaseAuthException catch (e) {
      throw FirebaseAuthException(code: e.code);
    } catch (e) {
      throw Exception(e);
    }
  }
}
