import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/firebase_auth_linker.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/widgets/password_text_field.dart';

class UnlinkEmailPage extends StatefulWidget {
  const UnlinkEmailPage({super.key});

  @override
  State<UnlinkEmailPage> createState() => _UnlinkEmailPageState();
}

class _UnlinkEmailPageState extends State<UnlinkEmailPage> {
  late TextEditingController _password;
  EmailFBAuthProvider? _emailFBAuthProvider;
  late CurrentUserProfileGxC profileGxC = Get.find(tag: CURRENT_USER_TAG);
  late WildrUser user = profileGxC.user;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _password = TextEditingController();
    super.initState();
  }

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Widget _profileImage() =>
      Center(child: ProfilePageCommon().profileImageCircleAvatar(user));

  Future<void> _unlink(BuildContext context) async {
    await SystemChannels.textInput.invokeMethod('TextInput.hide');
    if (_password.text == '') {
      Common().showErrorSnackBar(
        _appLocalizations.profile_pleaseProvideAPassword,
        context,
      );
      return;
    }
    try {
      context.loaderOverlay.show();
      final email = WildrAuth().getEmailAddressFromLoginType(LoginType.EMAIL);
      if (email == null) {
        Common().showSomethingWentWrong(context);
        return;
      }
      _emailFBAuthProvider = EmailFBAuthProvider(
        email: email,
        password: _password.text,
      );
      if (_emailFBAuthProvider == null) {
        Common().showSomethingWentWrong(context);
        return;
      }
      await _emailFBAuthProvider!.signIn();
      final status = await _emailFBAuthProvider!.unlink(LoginType.EMAIL);
      context.loaderOverlay.hide();
      if (status.isSuccessful && mounted) {
        Navigator.pop(context);
        Navigator.pop(context);
        Common().showSnackBar(context, status.message);
      } else {
        Common().showSnackBar(context, status.message);
      }
    } catch (error) {
      context.loaderOverlay.hide();
      if (error is FirebaseAuthException) {
        debugPrint(error.toString());
        if (error.code == 'wrong-password') {
          Common().showErrorSnackBar(
            _appLocalizations.profile_incorrectPassword,
            context,
          );
          return;
        }
        Common()
            .showErrorSnackBar(error.message ?? kSomethingWentWrong, context);
      } else {
        Common().showErrorSnackBar(
          _appLocalizations.profile_somethingWentWrongPleaseTryAgainLater,
          context,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: Common()
            .appbarWithActions(title: _appLocalizations.profile_unlinkEmail),
        body: Center(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(25),
                child: _profileImage(),
              ),
              const SizedBox(height: 25),
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: PasswordTextField(passwordTextController: _password),
              ),
              OutlinedButton(
                style: ButtonStyle(
                  backgroundColor:
                      MaterialStateProperty.all<Color>(Colors.transparent),
                  shape: MaterialStateProperty.all(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(22.0),
                    ),
                  ),
                ),
                onPressed: () => _unlink(context),
                child: Text(
                  _appLocalizations.profile_cap_unlink,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
