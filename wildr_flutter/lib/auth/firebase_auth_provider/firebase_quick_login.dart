import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/auth_provider.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/widgets/get_password_dialog.dart';

extension FirebaseQuickLogin on AuthProvider {
  Future<void> quickLogin(
    BuildContext context, {
    String? savedEmail,
    String? checkGoogleEmail,
  }) async {
    final LoginType easiestLogin = WildrAuth().getEasiestLogin();
    if (easiestLogin == LoginType.PHONE) {
      throw UnimplementedError();
    }
    String? email;
    String? password;
    if (easiestLogin == LoginType.EMAIL) {
      context.loaderOverlay.hide();
      email = savedEmail ?? FirebaseAuth.instance.currentUser!.email;
      final TextEditingController controller = TextEditingController();
      await showCupertinoDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => GetPasswordDialog(
          controller,
          email: email!,
        ),
      );
      password = controller.text;
    }
    await easiestLogin.signIn(
      email: email,
      password: password,
      checkGoogleEmail: checkGoogleEmail,
    );
  }
}
