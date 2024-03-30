// ignore_for_file: no_default_cases, use_build_context_synchronously

import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/gen/assets.gen.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_scaffold.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/widgets/buttons/settings_button.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[OnboardingV3Page] $message');
}

class OnboardingV3Page extends StatelessWidget {
  const OnboardingV3Page({
    super.key,
    this.isEntryPoint = false,
    this.onSkipTapped,
    this.bodyData,
  })  : assert(
          !isEntryPoint || onSkipTapped != null,
          'onSkipTapped must not be null when isEntryPoint is true',
        ),
        showBackButton = !isEntryPoint;

  final bool showBackButton;
  final bool isEntryPoint;
  final OnboardingPageBodyData? bodyData;
  final VoidCallback? onSkipTapped;

  @override
  Widget build(BuildContext context) {
    final AppLocalizations appLocalizations = AppLocalizations.of(context)!;
    return OnboardingScaffold(
      backgroundColor: WildrColors.emerald1000,
      actions: [
        if (isEntryPoint) _skipButton(context, appLocalizations),
        if (showBackButton) const SettingsButton(),
      ],
      showBackButton: showBackButton,
      leadingIconColor: Colors.white,
      body: _body,
      footer: _footer(context, appLocalizations),
    );
  }

  Widget _skipButton(BuildContext context, AppLocalizations appLocalizations) =>
      TextButton(
        onPressed: () {
          _onSkipTapped(context);
        },
        child: Text(
          appLocalizations.login_signup_cap_skip,
          style: const TextStyle(
            color: WildrColors.white,
          ),
        ),
      );

  /// TODO: @Kamil to use [bodyData] to determine which page to show
  /// https://wildr.atlassian.net/browse/WILDR-6182
  /// https://wildr.atlassian.net/browse/WILDR-6181
  Widget get _body => _IntroPage(
        figure: Assets.onboarding.onboardingWelcomeGraphic.image(
          width: double.infinity,
          fit: BoxFit.fitWidth,
        ),
        background: const SizedBox.shrink(),
        title: '',
        subtitle: '',
      );

  Widget _footer(BuildContext context, AppLocalizations appLocalizations) {
    final String continueButtonText =
        appLocalizations.login_signup_createAccount;
    return Column(
      children: [
        PrimaryCta(
          backgroundColor: WildrColors.white,
          onPressed: () => _onCreateAccountPressed(context),
          text: continueButtonText,
          outline: true,
          fillWidth: true,
          filled: true,
          textColor: WildrColors.black,
        ),
        const SizedBox(height: 12),
        PrimaryCta(
          onPressed: () => _onSignInTapped(context),
          text: appLocalizations.onboarding_existingAccountSignInMessage,
          richText: RichText(
            text: TextSpan(
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: WildrColors.white,
                  ),
              children: [
                TextSpan(text: appLocalizations.onboarding_gotAnAccount),
                TextSpan(
                  text: appLocalizations.profile_signIn,
                  style: const TextStyle(
                    color: WildrColors.white,
                    decoration: TextDecoration.underline,
                  ),
                  recognizer: TapGestureRecognizer()
                    ..onTap = () => _onSignInTapped(context),
                ),
              ],
            ),
          ),
          fillWidth: true,
        ),
      ],
    );
  }

  void _onSkipTapped(BuildContext context) {
    Common().mainBloc(context).logCustomEvent(OnboardingEvents.kTapSkip);
    _completeOnboarding(context, didTapSkip: true);
  }

  void _onCreateAccountPressed(BuildContext context) {
    Common()
        .mainBloc(context)
        .logCustomEvent(OnboardingEvents.kTapCreateAccount);
    _completeOnboarding(context, didTapCreateAccount: true);
  }

  void _onSignInTapped(BuildContext context) {
    Common().mainBloc(context).logCustomEvent(OnboardingEvents.kTapSignIn);
    _completeOnboarding(context, didTapSignIn: true);
  }

  Future<void> _completeOnboarding(
    BuildContext context, {
    bool didTapSkip = false,
    bool didTapCreateAccount = false,
    bool didTapSignIn = false,
  }) async {
    if (isEntryPoint) {
      if (didTapSkip) {
        await Prefs.setBool(PrefKeys.kHasCompletedOnboarding, value: true);
        onSkipTapped?.call();
        return;
      }
    }
    await context.router
        .push(LoginPageRoute(isSignup: didTapCreateAccount))
        .then(
      (value) {
        Prefs.setBool(PrefKeys.kHasCompletedOnboarding, value: true);
        // context.popRoute();
      },
    );
  }
}

class _IntroPage extends StatelessWidget {
  final Widget background;
  final Widget figure;
  final String title;
  final String subtitle;

  const _IntroPage({
    required this.background,
    required this.figure,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) =>
      OnboardingBodyWithOptionalTitleAndSubtitle(
        body: Stack(
          alignment: Alignment.center,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20.0),
              child: background,
            ),
            figure,
          ],
        ),
      );
}
