import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/auth_provider.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/user_details.dart';

class EmailFBAuthProvider extends AuthProvider {
  EmailFBAuthProvider({required this.email, required this.password});

  String email;
  String password;

  @override
  AuthCredential getCredential([String? checkEmail]) =>
      EmailAuthProvider.credential(
        email: email,
        password: password,
      );

  @override
  Future<UserDetails> signIn() async {
    try {
      final UserCredential userCredential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(email: email, password: password);
      return UserDetails(
        firebaseUser: userCredential.user,
        signInType: LoginType.EMAIL,
      );
    } on FirebaseAuthException catch (e) {
      debugPrint(e.toString());
      throw FirebaseAuthException(code: e.code);
    } catch (e) {
      throw Exception(e);
    }
  }

  Future<UserCredential> signUp() async {
    try {
      return await FirebaseAuth.instance
          .createUserWithEmailAndPassword(email: email, password: password);
    } on FirebaseAuthException catch (e) {
      throw FirebaseAuthException(code: e.code);
    } catch (e) {
      throw Exception(e);
    }
  }
}
