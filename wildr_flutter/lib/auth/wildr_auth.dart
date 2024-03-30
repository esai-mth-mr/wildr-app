import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/widgets.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth_token_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth_token_provider_callbacks.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';

/// User auth service for the app.
/// Note: - All modules should use this class directly instead of
/// [WildrFirebaseAuthTokenProvider], [WildrFirebaseAuth], and [FirebaseAuth]
class WildrAuth {
  late WildrFirebaseAuthTokenProvider _tokenProvider;
  late WildrFirebaseAuth _auth;
  static WildrAuth? _instance;

  factory WildrAuth() {
    if (_instance == null) {
      throw Exception('Must call .init()');
    }
    return _instance!;
  }

  WildrAuth.init(WildrFirebaseAuthTokenProvider tokenProvider,
      WildrFirebaseAuth firebaseAuth,) {
    _instance = WildrAuth._(tokenProvider, firebaseAuth);
  }

  WildrAuth._(this._tokenProvider, this._auth);

  bool get isLoggedIn => _auth.isLoggedIn;

  Future<void> refreshTokenWhenLoggedIn({
    bool forceRefresh = false,
    String? caller,
    RefreshTokenCallbacks? cb,
  }) async {
    await _tokenProvider.refreshTokenWhenLoggedIn(
      forceRefresh: forceRefresh,
      caller: caller,
      cb: cb,
    );
  }

  Future<String?> getToken({
    bool forceRefresh = false,
    String? caller,
  }) async =>
      _tokenProvider.getToken(forceRefresh: forceRefresh, caller: caller);

  // Email

  Future<void> switchEmailToVerifiedEmailIfPossible() =>
      _auth.switchEmailToVerifiedEmailIfPossible();

  bool isEmailProviderButNotVerified() => _auth.isEmailProviderButNotVerified();

  String? getVerifiedEmail() => _auth.getVerifiedEmail();

  String? getEmailAddressFromLoginType(LoginType loginType) =>
      _auth.getEmailAddressFromLoginType(loginType);

  bool isEmailVerified() => _auth.isEmailVerified();

  Future<void> quickLogin(BuildContext context) => _auth.quickLogin(context);

  CanUnlink canUnlink(LoginType type) => _auth.canUnlink(type);

  // Phone
  bool hasOnlyPhoneNumberProvider() => _auth.hasOnlyPhoneNumberProvider();

  // Logout
  // TODO Rename to clearCredentials or something
  Future<void> removeFirebaseCredentials() => _auth.removeFirebaseCredentials();

  Future<void> disconnectWithGoogleCredentialsIfAny() =>
      _auth.disconnectWithGoogleCredentialsIfAny();

  // Providers Types
  int getProviderIdIndex(LoginType providerId) =>
      _auth.getProviderIdIndex(providerId);

  List<LoginType> getAllProviderTypes() => _auth.getAllProviderTypes();

  LoginType getEasiestLogin() => _auth.getEasiestLogin();

  bool checkIfProviderExists(LoginType loginType) =>
      _auth.checkIfProviderExists(loginType);
}
