// ignore_for_file: avoid_positional_boolean_parameters, lines_longer_than_80_chars

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_state.dart';
import 'package:wildr_flutter/login_signup/countdown_timer.dart';
import 'package:wildr_flutter/login_signup/login_gxc.dart';
import 'package:wildr_flutter/login_signup/only_digits_formatter.dart';
import 'package:wildr_flutter/login_signup/signup/signup_gxc.dart';

typedef OnResendCodeCallback = Function(bool callFromVerificationPage);

class VerificationPage extends StatelessWidget {
  late final LoginGetController _loginGxC;
  late final SignupGxC _signupGxC;

  VerificationPage({
    super.key,
    required this.onBackPressed,
    required this.onChanged,
    required this.onComplete,
    required this.phoneNumber,
    required this.onResendCode,
    required this.isSignUp,
  }) {
    if (isSignUp) {
      _signupGxC = Get.find();
    } else {
      _loginGxC = Get.find();
    }
  }

  final VoidCallback onBackPressed;
  final ValueChanged<String> onChanged;
  final ValueChanged<String>? onComplete;
  final String phoneNumber;
  final bool isSignUp;
  final OnResendCodeCallback onResendCode;

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          onBackPressed();
          return true;
        },
        child: Scaffold(
          appBar: AppBar(
            systemOverlayStyle: Theme.of(context).brightness == Brightness.dark
                ? SystemUiOverlayStyle.light
                : SystemUiOverlayStyle.dark,
            backgroundColor: Colors.transparent,
            elevation: 0,
            actions: [
              CountdownTimer(
                timerValue: isSignUp
                    ? _signupGxC.rxTimer
                    : _loginGxC.rxPhoneNumberTimerValue,
                onComplete: (value) {},
                resendButtonClicked: () => onResendCode(true),
              ),
            ],
          ),
          body: BlocListener<MainBloc, MainState>(
            listener: (context, state) {
              if (state is OtpVerificationFailedState) {
                context.loaderOverlay.hide();
              } else if (state is AskForHandleAndNameState) {
                context.loaderOverlay.hide();
                context.popRoute();
              } else if (state is LoginSignupFailedState) {
                context.loaderOverlay.hide();
                context.popRoute();
              } else if (state is AuthenticationSuccessfulState) {
                context.popRoute();
              }
            },
            child: Padding(
              padding: const EdgeInsets.only(top: 50),
              child: Column(
                children: [
                  Text(
                    AppLocalizations.of(context)!.login_signup_verificationCode,
                    textScaleFactor: 3,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.only(left: 40, right: 40),
                    child: PinCodeTextField(
                      pinTheme: PinTheme(
                        inactiveColor:
                            Theme.of(context).brightness == Brightness.light
                                ? Colors.black
                                : Colors.white,
                        selectedColor: Theme.of(context).primaryColor,
                      ),
                      appContext: context,
                      length: 6,
                      onChanged: onChanged,
                      onCompleted: (value) {
                        debugPrint('On Complete');
                        context.loaderOverlay.show();
                        onComplete?.call(value);
                      },
                      inputFormatters: [
                        OnlyDigitsFormatter(),
                      ],
                      autoFocus: true,
                      keyboardType: TextInputType.number,
                      keyboardAppearance: Theme.of(context).brightness,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 60, right: 60),
                    child: Text(
                      'We have sent you a code via SMS to $phoneNumber,'
                      ' ${AppLocalizations.of(context)!.login_signup_accountVerificationInstruction}',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}
