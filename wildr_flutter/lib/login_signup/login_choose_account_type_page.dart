import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/gen/assets.gen.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_scaffold.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class LoginChooseAccountTypeBody extends StatelessWidget {
  final VoidCallback? onContinueWithGoogle;
  final VoidCallback? onContinueWithApple;
  final VoidCallback? onContinueWithEmailOrPhone;

  const LoginChooseAccountTypeBody({
    super.key,
    this.onContinueWithGoogle,
    this.onContinueWithApple,
    this.onContinueWithEmailOrPhone,
  });

  @override
  Widget build(BuildContext context) => OnboardingScaffold(
        body: OnboardingBodyWithOptionalTitleAndSubtitle(
          body: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              // mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                SizedBox(
                  height: Get.height * 0.3,
                  child: Center(
                    child: Theme.of(context).brightness == Brightness.dark
                        ? Assets.onboarding.onboardingLogin.image()
                        : Assets.onboarding.onboardingLoginLightMode.image(),
                  ),
                ),
                const Spacer(),
                Column(
                  children: [
                    PrimaryCta(
                      text: AppLocalizations.of(context)!
                          .login_signup_continueWithGoogle,
                      icon: const Icon(
                        FontAwesomeIcons.google,
                        size: 20,
                      ),
                      fillWidth: true,
                      outline: true,
                      onPressed: onContinueWithGoogle,
                    ),
                    if (Platform.isIOS) ...[
                      const SizedBox(height: 16),
                      PrimaryCta(
                        text: AppLocalizations.of(context)!
                            .login_signup_continueWithApple,
                        icon: const Icon(
                          FontAwesomeIcons.apple,
                          size: 20,
                        ),
                        fillWidth: true,
                        outline: true,
                        onPressed: onContinueWithApple,
                      ),
                    ],
                    const SizedBox(height: 16),
                    PrimaryCta(
                      text: AppLocalizations.of(context)!
                          .login_signup_continueWithEmailOrPhone,
                      fillWidth: true,
                      outline: true,
                      onPressed: onContinueWithEmailOrPhone,
                    ),
                  ],
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
        footer: Padding(
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
                    ..onTap = () =>
                        context.pushRoute(const TermsOfServicePageRoute()),
                ),
                TextSpan(
                  text: AppLocalizations.of(context)!
                      .login_signup_dataFeesDisclaimer,
                ),
              ],
            ),
            style: const TextStyle(fontSize: 12, color: WildrColors.gray500),
            textAlign: TextAlign.center,
          ),
        ),
      );
}
