import 'package:auto_route/auto_route.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/input_decorations.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  ChangePasswordPageState createState() => ChangePasswordPageState();
}

class ChangePasswordPageState extends State<ChangePasswordPage> {
  late TextEditingController _oldPasswordController;
  late TextEditingController _newPasswordController;
  late TextEditingController _confirmPasswordController;
  late CurrentUserProfileGxC profileGxC = Get.find(tag: CURRENT_USER_TAG);
  late WildrUser user = profileGxC.user;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _oldPasswordController = TextEditingController();
    _newPasswordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
    super.initState();
  }

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _logoutUserAndAskThemToLogIn() async {
    Common().showErrorSnackBar(
      _appLocalizations.profile_somethingWentWrongPleaseLoginAgain,
      context,
    );
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    Common().mainBloc(context).add(PerformLogoutEvent());
    await Common().openLoginPage(context.router);
  }

  Future<void> _automaticallyLoginAndChangePassword() async {
    debugPrint('_automaticallyLoginAndTryAgain()');
    final String? email = FirebaseAuth.instance.currentUser?.email;
    if (email == null) {
      context.loaderOverlay.hide();
      await _logoutUserAndAskThemToLogIn();
    } else {
      await await FirebaseAuth.instance
          .signInWithEmailAndPassword(
            email: FirebaseAuth.instance.currentUser!.email!,
            password: _oldPasswordController.text,
          )
          .then(
            (value) => FirebaseAuth.instance.currentUser
                ?.updatePassword(_newPasswordController.text)
                .then(
              (_) {
                context.loaderOverlay.hide();
                Navigator.of(context).pop();
                Common().showErrorSnackBar(
                  _appLocalizations.profile_passwordSuccessfullyChanged,
                );
              },
            ).catchError(
              (error) {
                //Catch error of UpdatePassword
                context.loaderOverlay.hide();
                debugPrint(error.toString());
                if (error is FirebaseAuthException) {
                  if (error.code == 'weak-password') {
                    context.loaderOverlay.hide();
                    Common().showGetSnackBar(
                      _appLocalizations.profile_passwordTooWeak,
                    );
                    return;
                  }
                }
                debugPrint(error.toString());
                Common().showErrorSnackBar(kSomethingWentWrong);
              },
            ),
          )
          .catchError(
        (error) {
          //Catch error of SignInWithEmail
          context.loaderOverlay.hide();
          debugPrint(error.toString());
          if (error is FirebaseAuthException) {
            if (error.code == 'wrong-password') {
              Common().showErrorSnackBar(
                _appLocalizations.profile_passwordIsIncorrect,
              );
              return null;
            }
          }
          Common().showErrorSnackBar(
            _appLocalizations.profile_somethingWentWrongPleaseTryAgainLater,
          );
          return null;
        },
      );
    }
  }

  void _changePassword() {
    if (_oldPasswordController.text.isEmpty) {
      Common()
          .showErrorSnackBar(_appLocalizations.profile_pleaseEnterOldPassword);
    } else if (_newPasswordController.text == _confirmPasswordController.text) {
      context.loaderOverlay.show();
      _automaticallyLoginAndChangePassword();
    } else if (_newPasswordController.text == '' ||
        _confirmPasswordController.text == '') {
      Common()
          .showErrorSnackBar(_appLocalizations.profile_passwordCanNotBeEmpty);
    } else {
      Common().showErrorSnackBar(_appLocalizations.profile_passwordsMustMatch);
    }
  }

  Widget _textField(
    TextEditingController controller,
    String decorationText, {
    bool isFinal = false,
  }) =>
      TextField(
        controller: controller,
        keyboardAppearance: Theme.of(context).brightness,
        // autofillHints: [AutofillHints.password],
        autofocus: true,
        obscureText: true,
        autocorrect: false,
        enableSuggestions: false,
        style: TextStyle(fontSize: 18.0.w),
        textInputAction: isFinal ? TextInputAction.done : TextInputAction.next,
        decoration: InputDecorations.denseDecoration(decorationText),
        onSubmitted: (value) {
          if (isFinal) {
            _changePassword();
          }
        },
      );

  Widget _changePasswordButton() => ElevatedButton(
        style: ButtonStyle(
          backgroundColor:
              MaterialStateProperty.all<Color>(WildrColors.primaryColor),
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22.0),
            ),
          ),
        ),
        onPressed: _changePassword,
        child: Text(
          _appLocalizations.profile_changePassword,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        resizeToAvoidBottomInset: true,
        appBar: Common()
            .appbarWithActions(title: _appLocalizations.profile_changePassword),
        body: Padding(
          padding: const EdgeInsets.all(25.0),
          child: Wrap(
            runSpacing: 15,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _textField(
                _oldPasswordController,
                _appLocalizations.profile_oldPassword,
              ),
              _textField(
                _newPasswordController,
                _appLocalizations.profile_newPassword,
              ),
              _textField(
                _confirmPasswordController,
                _appLocalizations.profile_confirmPassword,
                isFinal: true,
              ),
              Padding(
                padding: const EdgeInsets.only(top: 30.0),
                child: Center(child: _changePasswordButton()),
              ),
            ],
          ),
        ),
      );
}
