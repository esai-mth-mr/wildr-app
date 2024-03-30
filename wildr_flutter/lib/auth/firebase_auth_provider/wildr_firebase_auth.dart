// ignore_for_file: avoid_positional_boolean_parameters

import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/apple_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/firebase_quick_login.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/google_fb_auth_provider.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';

part 'wildr_firebase_auth_ext_email.dart';
part 'wildr_firebase_auth_ext_logout.dart';
part 'wildr_firebase_auth_ext_providers.dart';

/// To be initialized only during AppStartup
class WildrFirebaseAuth {
  static WildrFirebaseAuth? _instance;

  late final FirebaseAuth firebaseAuth;

  factory WildrFirebaseAuth(FirebaseAuth firebaseAuth) {
    if (_instance != null) {
      throw Exception(
          'WildrFirebaseAuth() seems to be injected in WildrAuth already. '
          'Do not use this class directly. Use WildrAuth instead. '
          'If the function you are looking for is not present, '
          'feel free to write a wrapper.');
    }
    _instance ??= WildrFirebaseAuth._(firebaseAuth);
    return _instance!;
  }

  WildrFirebaseAuth._(this.firebaseAuth);

  bool get isLoggedIn => firebaseAuth.currentUser != null;

  CanUnlink canUnlink(LoginType type) {
    if (firebaseAuth.currentUser?.providerData.length == 1) {
      return CanUnlink(
        canUnlink: false,
        message: 'You cannot unlink your ${type.toViewString()} account '
            'without having another sign-in method',
      );
    } else if (firebaseAuth.currentUser?.providerData.length == 2 &&
        checkIfProviderExists(LoginType.APPLE) &&
        Platform.isAndroid) {
      return CanUnlink(
        canUnlink: false,
        message: 'You will lose access to your account on Android '
            'if you unlink your Google account',
      );
    }
    return CanUnlink(canUnlink: true, message: '');
  }

  // TODO REFACTOR: MUST NOT USE context
  Future<void> quickLogin(BuildContext context) async {
    try {
      final LoginType loginType = getEasiestLogin();
      switch (loginType) {
        case LoginType.EMAIL:
          await EmailFBAuthProvider(password: '', email: '').quickLogin(
            context,
            savedEmail: firebaseAuth.currentUser?.email ??
                Common().mainBloc(context).getUserEmail(),
          );
        case LoginType.PHONE:
          throw UnimplementedError();
        case LoginType.GOOGLE:
          await GoogleFBAuthProvider().quickLogin(context);
        case LoginType.APPLE:
          await AppleFBAuthProvider().quickLogin(context);
      }
    } catch (e) {
      Common().showErrorSnackBar(kSomethingWentWrong, context);
    }
  }
}

void print(dynamic message) {
  debugPrint('[WildrFirebaseAuth]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ WildrFirebaseAuth: $message');
}

class CanUnlink {
  bool canUnlink;
  String message;

  CanUnlink({required this.canUnlink, required this.message});
}
