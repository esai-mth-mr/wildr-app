import 'package:firebase_auth/firebase_auth.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';

class UserDetails {
  final LoginType signInType;
  final User? firebaseUser;
  final String? email;
  final String? displayName;
  final String? phoneNumber;
  final bool shouldShowErrorMessage;

  UserDetails({
    this.firebaseUser,
    this.email,
    this.displayName,
    this.signInType = LoginType.GOOGLE,
    this.phoneNumber,
    this.shouldShowErrorMessage = false,
  });

  @override
  String toString() => 'UserDetails{signInType: $signInType,'
      ' firebaseUser: $firebaseUser, email: $email,'
      ' displayName: $displayName, phoneNumber: $phoneNumber,'
      ' shouldShowErrorMessage: $shouldShowErrorMessage}';
}
