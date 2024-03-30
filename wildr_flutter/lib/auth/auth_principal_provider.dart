import 'package:flutter/foundation.dart';

void print(String message) {
  debugPrint('[GqlFirebaseAuthTokenProvider] $message');
}

/// can act as a singleton [instance]
/// can provide a temp obj [GqlFirebaseAuthTokenProvider.temp]
class AuthPrincipalProvider {
  String? token;
  String? userId;

  AuthPrincipalProvider._internal();

  static final AuthPrincipalProvider _instance =
      AuthPrincipalProvider._internal();

  static AuthPrincipalProvider get instance => _instance;

  void updateTokenIfNeeded(String? newToken) {
    print('updateTokenIfNeeded');
    if (token == newToken) {
      print('same token received');
      return;
    }
    token = newToken;
  }

  void reset() {
    resetToken();
    removeUserId();
  }

  void resetToken() {
    print('Resetting token');
    token = null;
  }

  void setUserId(String userId) {
    print('setUserId');
    this.userId = userId;
  }

  void removeUserId() {
    print('removeUserId');
    userId = null;
  }
}
