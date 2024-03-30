import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/input_decorations.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SignInEmailPage extends StatefulWidget {
  const SignInEmailPage({super.key, required this.profileImage});
  final Widget profileImage;

  @override
  State<SignInEmailPage> createState() => _SignInEmailPageState();
}

class _SignInEmailPageState extends State<SignInEmailPage> {
  late TextEditingController _password;

  late TextEditingController _email;
  late EmailFBAuthProvider _emailFBAuthProvider;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _password = TextEditingController();
    _email = TextEditingController();
    super.initState();
  }

  @override
  void dispose() {
    _password.dispose();
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar:
            Common().appbarWithActions(title: _appLocalizations.profile_signIn),
        body: Center(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(25),
                child: widget.profileImage,
              ),
              const SizedBox(height: 25),
              const Divider(),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: TextField(
                  controller: _email,
                  keyboardAppearance: Theme.of(context).brightness,
                  autofillHints: const [AutofillHints.password],
                  style: TextStyle(fontSize: 18.0.w),
                  textInputAction: TextInputAction.done,
                  decoration: InputDecorations.denseDecoration(
                    _appLocalizations.profile_cap_email,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: TextField(
                  controller: _password,
                  keyboardAppearance: Theme.of(context).brightness,
                  autofillHints: const [AutofillHints.password],
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  style: TextStyle(fontSize: 18.0.w),
                  textInputAction: TextInputAction.done,
                  decoration: InputDecorations.denseDecoration(
                    _appLocalizations.profile_cap_password,
                  ),
                ),
              ),
              ElevatedButton(
                style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all<Color>(
                    WildrColors.primaryColor,
                  ),
                  shape: MaterialStateProperty.all(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(22.0),
                    ),
                  ),
                ),
                onPressed: () async {
                  _emailFBAuthProvider = EmailFBAuthProvider(
                    email: _email.text,
                    password: _password.text,
                  );
                  try {
                    await _emailFBAuthProvider.signIn();
                  } catch (e) {
                    if (e is FirebaseAuthException) {
                      if (e.code == 'weak-password') {
                        Common().showSnackBar(
                          context,
                          _appLocalizations.profile_passwordTooWeak,
                        );
                      } else if (e.code == 'email-already-in-use') {
                        Common().showSnackBar(
                          context,
                          _appLocalizations.profile_emailAlreadyExists,
                        );
                      }
                    } else {
                      Common().showErrorSnackBar(kSomethingWentWrong, context);
                    }
                  }
                },
                child: Text(
                  _appLocalizations.profile_signIn,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
