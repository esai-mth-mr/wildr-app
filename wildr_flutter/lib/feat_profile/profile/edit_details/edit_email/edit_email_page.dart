import 'package:auto_route/auto_route.dart';
import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('EditEmailPage: $message');
}

class EditEmailPage extends StatefulWidget {
  const EditEmailPage(this.email, {super.key});

  final String email;

  @override
  State<EditEmailPage> createState() => _EditEmailPageState();
}

class _EditEmailPageState extends State<EditEmailPage> {
  bool isLoading = false;
  bool isEmailAssociated = false;
  late TextEditingController emailEC =
      TextEditingController(text: widget.email);
  late TextEditingController passEC = TextEditingController();
  late TextEditingController confirmPassEC = TextEditingController();
  String? emailErrorMessage;
  String? passwordErrorMessage;
  String? confirmPasswordErrorMessage;
  bool _isShowingLoader = false;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    //Check for provider
    _isAnyEmailAssociated();
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _isAnyEmailAssociated() async {
    for (final UserInfo userInfo
        in FirebaseAuth.instance.currentUser!.providerData) {
      print(userInfo.providerId);
      if (userInfo.providerId == 'password') {
        setState(() {
          isEmailAssociated = true;
        });
        break;
      }
    }
  }

  AppBar _appBar() => Common().appbarWithActions(
        title: _appLocalizations.profile_cap_email,
      );

  Widget _body() => BlocListener<MainBloc, MainState>(
        listener: (context, state) async {
          if (state is UpdateUserEmailState) {
            setState(() {
              isLoading = false;
            });
            if (state.errorMessage == null) {
              _hideLoader();
              Navigator.of(context).pop();
              Common().showConfirmationSnackBar(
                _appLocalizations.profile_emailUpdatedSuccessfully,
                context,
              );
            } else {
              Common().showErrorSnackBar(state.errorMessage!, context);
            }
          }
        },
        child: Container(
          height: Get.height,
          padding: const EdgeInsets.only(left: 18.0, right: 18.0, top: 18.0),
          child:
              isEmailAssociated ? _updateEmailView() : _noAssociatedEmailView(),
        ),
      );

  Widget _verifyEmailButton() => SizedBox(
        width: MediaQuery.of(context).size.width * 0.5,
        height: MediaQuery.of(context).size.height * 0.05,
        child: ElevatedButton(
          style: ButtonStyle(
            backgroundColor:
                MaterialStateProperty.all<Color>(WildrColors.secondaryColor),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15.0),
              ),
            ),
          ),
          onPressed: () =>
              Common().mainBloc(context).add(SendEmailAndShowDialogEvent()),
          child: Text(
            _appLocalizations.profile_sendVerificationEmail,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: WildrColors.primaryColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  Widget _updateEmailView() => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Email: ${widget.email}',
            style: TextStyle(
              color: WildrColors.textColorStrong(),
              fontSize: 18,
            ),
          ),
          const Divider(),
          const SizedBox(height: 10),
          Center(child: _changePasswordButton()),
          const SizedBox(height: 10),
          if (!WildrAuth().isEmailVerified())
            Center(child: _verifyEmailButton()),
          if (!WildrAuth().isEmailVerified()) const SizedBox(height: 10),
          Center(child: _unlinkButton()),
          const SizedBox(height: 10),
        ],
      );

  Widget _noAssociatedEmailView() => Column(
        children: [
          Text(
            _appLocalizations.profile_emailAssociationPrompt,
            style: TextStyle(
              color: Colors.grey[
                  Theme.of(context).brightness == Brightness.dark ? 400 : 600],
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 30),
          TextField(
            keyboardAppearance: Theme.of(context).brightness,
            autocorrect: false,
            controller: emailEC,
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (emailErrorMessage != null) {
                setState(() {
                  emailErrorMessage = null;
                });
              }
            },
            decoration: InputDecoration(
              hintText: 'Email',
              errorText: emailErrorMessage,
            ),
          ),
          const SizedBox(height: 30),
          TextField(
            keyboardAppearance: Theme.of(context).brightness,
            autocorrect: false,
            obscureText: true,
            controller: passEC,
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (passwordErrorMessage != null) {
                setState(() {
                  passwordErrorMessage = null;
                });
              }
            },
            decoration: InputDecoration(
              hintText: _appLocalizations.profile_cap_password,
              errorText: passwordErrorMessage,
            ),
          ),
          const SizedBox(
            height: 30,
          ),
          TextField(
            keyboardAppearance: Theme.of(context).brightness,
            autocorrect: false,
            obscureText: true,
            controller: confirmPassEC,
            textInputAction: TextInputAction.done,
            onChanged: (_) {
              if (confirmPasswordErrorMessage != null) {
                setState(() {
                  confirmPasswordErrorMessage = null;
                });
              }
            },
            decoration: InputDecoration(
              hintText: _appLocalizations.profile_confirmPassword,
              errorText: confirmPasswordErrorMessage,
            ),
            onSubmitted: (string) {
              _submit();
            },
          ),
          const SizedBox(height: 30),
          _submitButton(),
          const SizedBox(height: 50),
          Text(
            _appLocalizations.comm_cap_or,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 30),
          Divider(
            thickness: 1.2,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 30),
        ],
      );

  Widget _unlinkButton() => SizedBox(
        width: MediaQuery.of(context).size.width * 0.5,
        height: MediaQuery.of(context).size.height * 0.05,
        child: OutlinedButton(
          onPressed: () {
            context
                .pushRoute(
                  const UnlinkEmailPageRoute(),
                )
                .then((_) => FirebaseAuth.instance.currentUser!.reload());
          },
          style: ButtonStyle(
            backgroundColor:
                MaterialStateProperty.all<Color>(Colors.transparent),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15.0),
              ),
            ),
          ),
          child: Text(
            _appLocalizations.profile_cap_unlink,
            style: const TextStyle(color: Colors.red),
          ),
        ),
      );

  Widget _changePasswordButton() => SizedBox(
        width: MediaQuery.of(context).size.width * 0.5,
        height: MediaQuery.of(context).size.height * 0.05,
        child: ElevatedButton(
          style: ButtonStyle(
            backgroundColor:
                MaterialStateProperty.all<Color>(WildrColors.primaryColor),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15.0),
              ),
            ),
          ),
          onPressed: () {
            context.pushRoute(const ChangePasswordPageRoute());
          },
          child: Text(
            _appLocalizations.profile_changePassword,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _appBar(),
        body: _body(),
      );

  Widget _submitButton() => SizedBox(
        width: MediaQuery.of(context).size.width * 0.5,
        height: MediaQuery.of(context).size.height * 0.05,
        child: ElevatedButton(
          style: ButtonStyle(
            backgroundColor:
                MaterialStateProperty.all<Color>(WildrColors.primaryColor),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15.0),
              ),
            ),
          ),
          onPressed: _submit,
          child: Text(
            _appLocalizations.profile_cap_connect,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  void _submit() {
    if (isEmailAssociated) {
      if (emailEC.text.isEmpty) {
        Common().showErrorSnackBar(
          _appLocalizations.profile_canNotUpdateEmptyEmail,
        );
        return;
      }
      if (isLoading) {
        return;
      } else {
        _updateEmail();
      }
    } else {
      if (emailEC.text.isEmpty) {
        setState(() {
          emailErrorMessage = _appLocalizations.profile_canNotUpdateEmptyEmail;
        });
        return;
      }
      if (passEC.text.isEmpty) {
        setState(() {
          passwordErrorMessage =
              _appLocalizations.profile_canNotUpdateEmptyHandle;
        });
        return;
      }
      if (passEC.text.isEmpty) {
        setState(() {
          confirmPasswordErrorMessage =
              _appLocalizations.profile_pleaseConfirmYourPassword;
        });
        return;
      }

      if (passEC.text != confirmPassEC.text) {
        setState(() {
          confirmPasswordErrorMessage =
              _appLocalizations.profile_passwordsDoNotMatch;
        });
        return;
      }
      _signupWithEmail();
    }
  }

  Future<void> _updateEmail() async {
    print('Updating email');
    try {
      //In case there was some error at our server!
      print(FirebaseAuth.instance.currentUser!.email);
      print(emailEC.text);
      setState(() {
        isLoading = true;
      });
      if (FirebaseAuth.instance.currentUser!.email != emailEC.text) {
        await FirebaseAuth.instance.currentUser!.updateEmail(emailEC.text);
      }
      print('Email updated in firebase');
      Common().mainBloc(context).add(
            UpdateUserEmailEvent(
              emailEC.text,
            ),
          );
    } on FirebaseAuthException catch (e) {
      if (e.code == 'weak-password') {
        print('The password provided is too weak.');
      } else if (e.code == 'email-already-in-use') {
        print('The account already exists for that email.');
      } else {
        print(e.code);
      }
    } catch (e) {
      print('ERROR AA GAYA');
      print(e);
    }
  }

  Future<void> _signupWithEmail() async {
    print('Signup with email');
    _showLoader();
    try {
      _showSthWentWrong();
      print('Trying to link');
      await FirebaseAuth.instance.currentUser!.linkWithCredential(
        EmailAuthProvider.credential(
          email: emailEC.text,
          password: passEC.text,
        ),
      );
      print('Now i have linked the account');
      if (FirebaseAuth.instance.currentUser == null) {
        _showSthWentWrong();
        return;
      }
      Common().mainBloc(context).add(
            UpdateUserEmailEvent(
              emailEC.text,
            ),
          );
    } on FirebaseAuthException catch (e) {
      _hideLoader();
      if (e.code == 'weak-password') {
        print('The password provided is too weak.');
        passwordErrorMessage = 'Password too weak';
      } else if (e.code == 'email-already-in-use') {
        print('The account already exists for that email.');
        emailErrorMessage = 'Email already exists!';
      }
      setState(() {});
    } catch (e) {
      _hideLoader();
      print(e);
      _showSthWentWrong();
    }
  }

  void _showLoader({String? message}) {
    if (_isShowingLoader) {
      return;
    }
    setState(() {
      _isShowingLoader = true;
    });

    AwesomeDialog(
      context: context,
      //dialogType: DialogType.ERROR,
      customHeader: const CupertinoActivityIndicator(
        radius: 30,
      ),
      title: message ?? _appLocalizations.profile_signingYouIn,
      headerAnimationLoop: false,
      useRootNavigator: true,
      dismissOnTouchOutside: false,
      dismissOnBackKeyPress: false,
    ).show();
    return;
  }

  void _hideLoader() {
    if (_isShowingLoader) {
      Navigator.of(context).pop();
      setState(() {
        _isShowingLoader = false;
      });
    }
  }

  void _showSthWentWrong() {
    _showToast(kSomethingWentWrong);
  }

  void _showToast(String message, {bool isError = true}) {
    if (isError) {
      Common().showErrorSnackBar(message);
    } else {
      Common().showSnackBar(context, message);
    }
  }
}
