import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/firebase_quick_login.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/google_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/common/status_and_error.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';

extension FirebaseLink on AuthProvider {
  Future<StatusAndMessage> link(
    LoginType type,
    BuildContext context,
  ) async {
    try {
      String? googleEmail;
      debugPrint(FirebaseAuth.instance.currentUser!.providerData.toString());
      if (WildrAuth().checkIfProviderExists(LoginType.GOOGLE)) {
        debugPrint(
          WildrAuth().getProviderIdIndex(LoginType.GOOGLE).toString(),
        );
        googleEmail = FirebaseAuth
            .instance
            .currentUser!
            .providerData[WildrAuth().getProviderIdIndex(LoginType.GOOGLE)]
            .email;
      }
      // login again as firebase requires a recent login to link an account
      await quickLogin(context, checkGoogleEmail: googleEmail);
      final AuthCredential? credential = await getCredential();
      if (credential == null) {
        return const StatusAndMessage(
          isSuccessful: false,
          message: 'Cancelled linking',
        );
      }
      await FirebaseAuth.instance.currentUser!.linkWithCredential(credential);
      return StatusAndMessage(
        isSuccessful: true,
        message: '${type.toViewString()} linked',
      );
    } on IncorrectAccountException catch (er) {
      return StatusAndMessage(
        isSuccessful: false,
        message: er.message,
      );
    } on FirebaseAuthException catch (e) {
      debugPrint(e.toString());
      if (e.code == 'credential-already-in-use') {
        return const StatusAndMessage(
          isSuccessful: false,
          message: 'Account already in use',
        );
      } else if (e.code == 'email-already-in-use') {
        return const StatusAndMessage(
          isSuccessful: false,
          message: 'Account already in use',
        );
      } else if (e.code == 'wrong-password') {
        return const StatusAndMessage(
          isSuccessful: false,
          message: 'Incorrect password',
        );
      } else {
        return StatusAndMessage(
          isSuccessful: false,
          message: 'Error trying to link ${type.toViewString()}',
        );
      }
    } catch (error) {
      if (error.toString().toLowerCase().contains('incorrect account used')) {
        return const StatusAndMessage(
          isSuccessful: false,
          message: 'Incorrect account used',
        );
      }
      debugPrint('Error while  ${type.toViewString()} sign in $error');
      return StatusAndMessage(
        isSuccessful: false,
        message: 'Error trying to link  ${type.toViewString()}',
      );
    }
  }

  Future<StatusAndMessage> unlink(LoginType type) async {
    if (WildrAuth().canUnlink(type).canUnlink) {
      if (type == LoginType.EMAIL) {
        try {
          await WildrAuth().switchEmailToVerifiedEmailIfPossible();
          await FirebaseAuth.instance.currentUser!
              .unlink(type.parseToProviderId());
          await WildrAuth().getToken(
            forceRefresh: true,
            caller: 'FirebaseAuthLinker#unlink()',
          );
          return const StatusAndMessage(
            isSuccessful: true,
            message: 'Email Unlinked',
          );
        } catch (e) {
          return const StatusAndMessage(
            isSuccessful: false,
            message: 'Error Unlinking',
          );
        }
      }
      try {
        String? googleEmail;
        if (WildrAuth().checkIfProviderExists(LoginType.GOOGLE)) {
          googleEmail = FirebaseAuth
              .instance
              .currentUser!
              .providerData[WildrAuth().getProviderIdIndex(LoginType.GOOGLE)]
              .email;
        }
        final OAuthCredential? cred = await getCredential(googleEmail);
        if (cred == null) {
          return const StatusAndMessage(
            isSuccessful: false,
            message: 'Unlinking was cancelled',
          );
        }

        await FirebaseAuth.instance.signInWithCredential(cred);
        await FirebaseAuth.instance.currentUser!
            .unlink(type.parseToProviderId());
        return StatusAndMessage(
          isSuccessful: true,
          message: '${type.toViewString()} Unlinked',
        );
      } on IncorrectAccountException catch (e) {
        return StatusAndMessage(
          isSuccessful: false,
          message: e.message,
        );
      } catch (error) {
        debugPrint('Error while ${type.toViewString()} sign in $error');
        return const StatusAndMessage(
          isSuccessful: false,
          message: 'Error Unlinking',
        );
      }
    } else {
      return StatusAndMessage(
        isSuccessful: false,
        message: WildrAuth().canUnlink(type).message,
      );
    }
  }
}
