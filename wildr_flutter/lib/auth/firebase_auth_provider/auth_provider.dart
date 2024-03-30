import 'package:wildr_flutter/login_signup/user_details.dart';

abstract class AuthProvider {
  Future<UserDetails> signIn();

  dynamic getCredential([String? checkEmail]);
}
