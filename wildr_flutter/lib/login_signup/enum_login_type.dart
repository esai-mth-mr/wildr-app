import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/apple_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/google_fb_auth_provider.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/login_signup/signup/signup_signup_after_handle_details.dart';
import 'package:wildr_flutter/login_signup/user_details.dart';

enum LoginType {
  EMAIL,
  PHONE,
  GOOGLE,
  APPLE,
}

extension ParseLoginType on LoginType {
  String toViewString() {
    if (this == LoginType.APPLE || this == LoginType.GOOGLE) {
      return '${name[0].toUpperCase()}${name.substring(1).toLowerCase()}';
    } else {
      return name.toLowerCase();
    }
  }

  String toSignUpString() {
    switch (this) {
      case LoginType.EMAIL:
        return 'Sign up with email ';
      case LoginType.PHONE:
        return 'Sign up with phone ';
      case LoginType.GOOGLE:
        return 'Sign in with Google';
      case LoginType.APPLE:
        return 'Sign in with Apple ';
    }
  }

  String toSignInString() {
    switch (this) {
      case LoginType.EMAIL:
        return 'Sign in with email ';
      case LoginType.PHONE:
        return 'Sign in with phone ';
      case LoginType.GOOGLE:
        return 'Sign in with Google';
      case LoginType.APPLE:
        return 'Sign in with Apple ';
    }
  }

  SignupAfterHandleDetails getSignupAfterHandleDetails([
    String? email,
    String? password,
  ]) {
    if (this == LoginType.EMAIL) {
      if (email == null) {
        throw Exception('Please profile email');
      } else if (password == null) {
        throw Exception('Please provide password');
      }
    }
    switch (this) {
      case LoginType.EMAIL:
        return SignupAfterHandleDetails(
          email: email,
          loginType: this,
          credentials: {'email': email, 'password': password},
        );
      case LoginType.PHONE:
        return SignupAfterHandleDetails(loginType: this);
      case LoginType.GOOGLE:
        return SignupAfterHandleDetails(loginType: this);
      case LoginType.APPLE:
        return SignupAfterHandleDetails(loginType: this);
    }
  }

  Widget getIcon({double? size, Color? color}) {
    switch (this) {
      case LoginType.EMAIL:
        return WildrIcon(
          WildrIcons.mail_filled,
          size: size,
          color: color,
        );
      case LoginType.PHONE:
        return WildrIcon(
          WildrIcons.phone_filled,
          size: size,
          color: color,
        );
      case LoginType.GOOGLE:
        return Icon(
          FontAwesomeIcons.google,
          size: size,
          color: color,
        );
      case LoginType.APPLE:
        return Icon(
          FontAwesomeIcons.apple,
          size: size,
          color: color,
        );
    }
  }

  Future<UserDetails> signIn({
    String? email,
    String? password,
    String? checkGoogleEmail,
  }) async {
    if (this == LoginType.EMAIL) {
      if (email == null) {
        throw Exception('Please provide email');
      } else if (password == null) {
        throw Exception('Please provide password');
      }
    }
    switch (this) {
      case LoginType.EMAIL:
        return await EmailFBAuthProvider(
          email: email!,
          password: password!,
        ).signIn();
      case LoginType.GOOGLE:
        return await GoogleFBAuthProvider().signIn(checkGoogleEmail);
      case LoginType.APPLE:
        return await AppleFBAuthProvider().signIn();
      case LoginType.PHONE:
        throw Exception('Cannot use phone number');
    }
  }

  String parseToProviderId() {
    switch (this) {
      case LoginType.EMAIL:
        return 'password';
      case LoginType.PHONE:
        return 'phone';
      case LoginType.GOOGLE:
        return 'google.com';
      case LoginType.APPLE:
        return 'apple.com';
    }
  }
}
