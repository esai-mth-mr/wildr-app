import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import 'package:wildr_flutter/login_signup/login_gxc.dart';
import 'package:wildr_flutter/login_signup/widgets/email_text_field.dart';
import 'package:wildr_flutter/login_signup/widgets/password_text_field.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_scaffold.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class LoginEmailOrPhonePage extends StatefulWidget {
  final TextEditingController phoneNumberTextEditingController;
  final TextEditingController emailTextEditingController;
  final TextEditingController passwordTextEditingController;
  final VoidCallback onPhoneSendVerificationCodePressed;
  final VoidCallback onEmailContinuePressed;
  final VoidCallback onEmailContinueLongPress;

  const LoginEmailOrPhonePage({
    super.key,
    required this.phoneNumberTextEditingController,
    required this.emailTextEditingController,
    required this.passwordTextEditingController,
    required this.onPhoneSendVerificationCodePressed,
    required this.onEmailContinuePressed,
    required this.onEmailContinueLongPress,
  });

  @override
  State<LoginEmailOrPhonePage> createState() => _LoginEmailOrPhonePageState();
}

class _LoginEmailOrPhonePageState extends State<LoginEmailOrPhonePage> {
  late final LoginGetController _loginGxC = Get.find();
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) => Obx(
        () => OnboardingScaffold(
          onBackButtonPressed: () {
            _loginGxC.isSubmitting = false;
            _loginGxC.passEM.value = '';
            _loginGxC.emailEM.value = '';
            _loginGxC.phNoEM.value = '';
            Navigator.of(context).pop();
          },
          body: OnboardingBodyWithOptionalTitleAndSubtitle(
            body: Padding(
              padding: const EdgeInsets.only(top: 24),
              child: DefaultTabController(
                length: _loginGxC.isSignUp.isTrue ? 1 : 2,
                child: Column(
                  children: [
                    Text(
                      _loginGxC.isSignUp.isTrue
                          ? _appLocalizations.login_signup_enter_phone
                          : _appLocalizations.login_signup_signIn,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const SizedBox(height: 12),
                    if (_loginGxC.isSignUp.isFalse)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: TabBar(
                          tabs: [
                            Tab(text: _appLocalizations.login_signup_cap_phone),
                            Tab(text: _appLocalizations.profile_cap_email),
                          ],
                          onTap: (value) =>
                              FocusManager.instance.primaryFocus?.unfocus(),
                        ),
                      ),
                    Expanded(
                      child: TabBarView(
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _PhoneForm(
                            phoneNumberTextEditingController:
                                widget.phoneNumberTextEditingController,
                            onPhoneSendVerificationCodePressed:
                                widget.onPhoneSendVerificationCodePressed,
                          ),
                          if (_loginGxC.isSignUp.isFalse)
                            _EmailForm(
                              emailTextEditingController:
                                  widget.emailTextEditingController,
                              passwordTextEditingController:
                                  widget.passwordTextEditingController,
                              onEmailContinuePressed: () {
                                FocusManager.instance.primaryFocus?.unfocus();
                                widget.onEmailContinuePressed();
                              },
                              onEmailContinueLongPress:
                                  widget.onEmailContinueLongPress,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          footer: _loginGxC.isSignUp.isTrue
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text.rich(
                    TextSpan(
                      text: AppLocalizations.of(context)!
                          .login_signup_byContinuingYouAreAgreeingToUur,
                      children: [
                        TextSpan(
                          text: AppLocalizations.of(context)!
                              .login_signup_termsAndConditions,
                          style: const TextStyle(
                            decoration: TextDecoration.underline,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => context
                                .pushRoute(const TermsOfServicePageRoute()),
                        ),
                        TextSpan(
                          text: AppLocalizations.of(context)!
                              .login_signup_dataFeesDisclaimer,
                        ),
                      ],
                    ),
                    style: const TextStyle(
                      fontSize: 12,
                      color: WildrColors.gray500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                )
              : const SizedBox.shrink(),
        ),
      );
}

class _PhoneForm extends StatefulWidget {
  final TextEditingController phoneNumberTextEditingController;
  final VoidCallback onPhoneSendVerificationCodePressed;

  const _PhoneForm({
    required this.phoneNumberTextEditingController,
    required this.onPhoneSendVerificationCodePressed,
  });

  @override
  State<_PhoneForm> createState() => _PhoneFormState();
}

class _PhoneFormState extends State<_PhoneForm>
    with AutomaticKeepAliveClientMixin {
  late final LoginGetController _loginGxC = Get.find();
  final PhoneNumber phoneNumberData = PhoneNumber(isoCode: 'US');
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return Obx(
      () => Padding(
        padding: const EdgeInsets.only(left: 12, right: 12, top: 36),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Text(
                _appLocalizations.login_signup_phone_label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            InternationalPhoneNumberInput(
              textFieldController: widget.phoneNumberTextEditingController,
              textStyle: const TextStyle(fontWeight: FontWeight.w500),
              selectorTextStyle: const TextStyle(fontWeight: FontWeight.w500),
              initialValue: phoneNumberData,
              onInputChanged: (number) {
                _loginGxC
                  ..emailOrPhoneNumberExists = false
                  ..fullPhoneNumber = number.phoneNumber ?? '';
                _loginGxC.phoneNumber.value = number.parseNumber();
                widget.phoneNumberTextEditingController.selection =
                    TextSelection.collapsed(
                  offset: widget.phoneNumberTextEditingController.text.length,
                );
              },
              hintText: null,
              selectorConfig: const SelectorConfig(
                leadingPadding: 12,
                selectorType: PhoneInputSelectorType.BOTTOM_SHEET,
                trailingSpace: false,
                useEmoji: true,
                setSelectorButtonAsPrefixIcon: true,
              ),
              errorMessage: _loginGxC.phNoEM.value.isEmpty
                  ? null
                  : _loginGxC.phNoEM.value,
            ),
            SizedBox(height: 30.0.w),
            if (_loginGxC.isSubmitting)
              const Center(child: CupertinoActivityIndicator(radius: 15))
            else
              PrimaryCta(
                text: _appLocalizations.login_signup_sendVerificationCode,
                disabled: _loginGxC.phoneNumber.value.isEmpty,
                onPressed: widget.onPhoneSendVerificationCodePressed,
                fillWidth: true,
                filled: true,
              ),
          ],
        ),
      ),
    );
  }
}

class _EmailForm extends StatefulWidget {
  final TextEditingController emailTextEditingController;
  final TextEditingController passwordTextEditingController;
  final VoidCallback onEmailContinuePressed;
  final VoidCallback onEmailContinueLongPress;

  const _EmailForm({
    required this.emailTextEditingController,
    required this.passwordTextEditingController,
    required this.onEmailContinuePressed,
    required this.onEmailContinueLongPress,
  });

  @override
  State<_EmailForm> createState() => _EmailFormState();
}

class _EmailFormState extends State<_EmailForm>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  late final LoginGetController _loginGxC = Get.find();
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  void _onPasswordSubmitted(String? value) {
    widget.onEmailContinuePressed();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return Obx(
      () => ListView(
        primary: false,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          EmailTextField(
            controller: widget.emailTextEditingController,
            onChanged: (value) {
              //TODO: Safely remove all this
              _loginGxC
                ..emailOrPhoneNumberExists = false
                ..didSendEmailVerification = false;
              _loginGxC.emailAddress.value = value;
              _loginGxC.emailVerificationTimerValue.value = 0;
              _loginGxC.emailVerificationTimer?.cancel();
              _loginGxC
                ..isSubmitting = false
                ..emailVerificationSentFromServer = false
                ..clearOTPData()
                ..wentToEmailVerificationPage = false;
              if (_loginGxC.emailEM.value.isEmpty) {
                return;
              }
              _loginGxC.emailEM.value = '';
            },
            errorMessage: _loginGxC.emailEM.string,
          ),
          PasswordTextField(
            passwordTextController: widget.passwordTextEditingController,
            onSubmitted: _onPasswordSubmitted,
            errorMessage: _loginGxC.passEM.string,
            onChanged: (value) {
              _loginGxC.password.value = value;
              if (_loginGxC.passEM.value.isEmpty) {
                return;
              }
              _loginGxC.passEM.value = '';
            },
            shouldShowForgotPassword: _loginGxC.isSignUp.isFalse,
          ),
          SizedBox(height: 30.0.w),
          if (_loginGxC.isSubmitting)
            const CupertinoActivityIndicator(radius: 15)
          else
            PrimaryCta(
              text: _appLocalizations.login_signup_cap_continue,
              disabled: _loginGxC.emailAddress.value.isEmpty ||
                  _loginGxC.password.value.isEmpty,
              onPressed: () {
                _onPasswordSubmitted(null);
              },
              onLongPress: widget.onEmailContinueLongPress,
              fillWidth: true,
              filled: true,
            ),
        ],
      ),
    );
  }
}
