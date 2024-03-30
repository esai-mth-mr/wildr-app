// ignore_for_file: no_default_cases

import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/gen/assets.gen.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_scaffold.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[ChallengesOnboardingWelcomePage] $message');
}

class ChallengesOnboardingPage extends StatefulWidget {
  final HomePageIntent? entryPointIntent;
  final bool skipLoginFlow;
  final bool showBackButton;
  final bool isEntryPoint;
  final bool isChallengeEducation;
  final bool isDynamicLinkRedirect;
  final Function(HomePageIntent? intent)? entryPointCallback;

  const ChallengesOnboardingPage({
    super.key,
    this.entryPointIntent,
    this.skipLoginFlow = false,
    this.showBackButton = false,
    this.isEntryPoint = true,
    this.isChallengeEducation = false,
    this.entryPointCallback,
    this.isDynamicLinkRedirect = false,
  });

  @override
  State<ChallengesOnboardingPage> createState() =>
      _ChallengesOnboardingPageState();
}

class _ChallengesOnboardingPageState extends State<ChallengesOnboardingPage> {
  late final PageController _pageController = PageController();
  int _currentPageNumber = 1;
  bool _hasCompletedOnboarding = false;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          if (widget.showBackButton) {
            print('[WillPopScope] returning true [showBackButton]');
            return true;
          } else {
            final shouldPop =
                Prefs.getString(PrefKeys.kChallengeIdForOnboarding) == null ||
                    _hasCompletedOnboarding;
            print('[WillPopScope] ShouldPop $shouldPop');
            return shouldPop;
          }
        },
        child: OnboardingScaffold(
          actions: [
            if (!widget.isChallengeEducation && _currentPageNumber < 3)
              TextButton(
                onPressed: _completeOnboarding,
                child: Text(
                  _appLocalizations.login_signup_cap_skip,
                  style: TextStyle(
                    color: ChallengesStyles.of(context)
                        .primaryTextColor
                        .withOpacity(0.5),
                  ),
                ),
              ),
          ],
          showBackButton: widget.showBackButton,
          body: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              PageView(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                children: _pages,
              ),
              _pageIndicator,
            ],
          ),
          footer: _footer,
        ),
      );

  void _onPageChanged(int pageNumber) {
    Common().mainBloc(context).logCustomEvent(
      ChallengesAnalyticsEvents.kSwipeChallengesOnboarding,
      {ChallengesAnalyticsParameters.kPageNumber: '${pageNumber + 1}'},
    );
    setState(() {
      _currentPageNumber = pageNumber + 1;
    });
  }

  Widget get _footer {
    final String continueButtonText;
    if (_currentPageNumber < _pages.length) {
      if (widget.isChallengeEducation) {
        continueButtonText = _appLocalizations.onboarding_tellMeMore;
      } else {
        continueButtonText = _appLocalizations.login_signup_cap_continue;
      }
    } else {
      if (widget.isChallengeEducation) {
        continueButtonText = _appLocalizations.onboarding_showMe;
      } else {
        continueButtonText = _appLocalizations.onboarding_LetsGetStarted;
      }
    }

    return Column(
      children: [
        PrimaryCta(
          onPressed: _onContinuePressed,
          text: continueButtonText,
          outline: true,
          fillWidth: true,
        ),
        const SizedBox(height: 12),
        if (widget.skipLoginFlow)
          PrimaryCta(
            onPressed: _completeOnboarding,
            text: widget.isChallengeEducation
                ? _appLocalizations.wildr_verify_cap_close
                : _appLocalizations.comm_gotIt,
            fillWidth: true,
          )
        else
          PrimaryCta(
            onPressed: _onAlreadyHaveAccountPressed,
            text: _appLocalizations.onboarding_existingAccountSignInMessage,
            richText: RichText(
              text: TextSpan(
                style: Theme.of(context).textTheme.bodyLarge,
                children: [
                  TextSpan(text: _appLocalizations.onboarding_gotAnAccount),
                  TextSpan(
                    text: _appLocalizations.profile_signIn,
                    style: const TextStyle(
                      decoration: TextDecoration.underline,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = _onAlreadyHaveAccountPressed,
                  ),
                ],
              ),
            ),
            fillWidth: true,
          ),
      ],
    );
  }

  void _onContinuePressed() {
    Common().mainBloc(context).logCustomEvent(
          ChallengesAnalyticsEvents.kContinueChallengesOnboarding,
        );
    if (_currentPageNumber == _pages.length) {
      _completeOnboarding();
    } else {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _onAlreadyHaveAccountPressed() {
    Common().mainBloc(context).logCustomEvent(
          ChallengesAnalyticsEvents.kSkipChallengesOnboarding,
        );
    _completeOnboarding();
  }

  Future<void> _completeOnboarding() async {
    _hasCompletedOnboarding = true;
    await Prefs.setBool(PrefKeys.kHasCompletedOnboarding, value: true);
    final entryPointIntent = widget.entryPointIntent;
    HomePageIntent? intent;
    final isLoggedIn = Common().isLoggedIn(context);
    if (entryPointIntent == null && widget.isEntryPoint) {
      print('Entry point intent is null and is entry point');
      if (!isLoggedIn) {
        intent = HomePageIntent(HomePageIntentType.LOGIN, null);
      } else {
        intent = HomePageIntent(HomePageIntentType.UNDEFINED, null);
      }
    }
    if (isLoggedIn) {
      Common()
          .mainBloc(context)
          .add(FinishOnboardingEvent(OnboardingType.CHALLENGES));
    }
    if (widget.isDynamicLinkRedirect) {
      await context.popRoute();
      return;
    }
    if (entryPointIntent != null) {
      intent = entryPointIntent;
    }
    if (widget.entryPointCallback != null) {
      widget.entryPointCallback!(intent);
      return;
    }
    await context.popRoute(intent);
  }

  Widget get _pageIndicator {
    final dotColor = Theme.of(context).brightness == Brightness.dark
        ? WildrColors.white
        : WildrColors.black;
    return Padding(
      padding: const EdgeInsets.only(top: 75, bottom: 55),
      child: SmoothPageIndicator(
        controller: _pageController,
        count: _pages.length,
        onDotClicked: (index) => _pageController.animateToPage(
          index,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        ),
        effect: ExpandingDotsEffect(
          activeDotColor: dotColor.withOpacity(0.5),
          dotColor: dotColor.withOpacity(0.25),
          dotHeight: 8,
        ),
      ),
    );
  }

  Widget get _page1 => _IntroPage(
        figure: Stack(
          clipBehavior: Clip.none,
          children: [
            Assets.challenges.onboarding.wildrLogoGreen.image(
              height: 65,
            ),
            Positioned(
              top: -100,
              left: -30,
              child: Assets.challenges.onboarding.heartGreen.image(
                height: 40,
              ),
            ),
            Positioned(
              top: -30,
              left: -40,
              child: Assets.challenges.onboarding.starGreen.image(height: 25),
            ),
            Positioned(
              top: -70,
              right: -40,
              child: Assets.challenges.onboarding.likeGreen.image(
                height: 50,
              ),
            ),
            Positioned(
              bottom: -30,
              right: -30,
              child: Assets.challenges.onboarding.starGreen.image(
                height: 35,
              ),
            ),
          ],
        ),
        background: Assets.challenges.onboarding.backgroundGreen.image(
          fit: BoxFit.fitWidth,
        ),
        title: '',
        subtitle:
            _appLocalizations.onboarding_trollFreeSocialNetworkDescription,
      );

  Widget get _page2 => _IntroPage(
        figure: Stack(
          clipBehavior: Clip.none,
          children: [
            Assets.challenges.onboarding.crownYellow.image(
              height: 125,
            ),
            Positioned(
              top: -50,
              left: 25,
              child: Assets.challenges.onboarding.crownTopYellow.image(
                height: 55,
              ),
            ),
            Positioned(
              top: -65,
              right: -30,
              child: Assets.challenges.onboarding.starYellow.image(
                height: 50,
              ),
            ),
            Positioned(
              right: -65,
              child: Assets.challenges.onboarding.starYellow.image(height: 40),
            ),
            Positioned(
              left: -30,
              bottom: -30,
              child: Assets.challenges.onboarding.starYellow.image(
                height: 25,
              ),
            ),
          ],
        ),
        background: Positioned.fill(
          bottom: -75,
          child: Assets.challenges.onboarding.backgroundYellow.image(
            fit: BoxFit.fitWidth,
          ),
        ),
        title: _appLocalizations.onboarding_challengeYourself,
        subtitle: widget.isChallengeEducation
            ? _appLocalizations.onboarding_consistentGoalOrLearnSkillDescription
            : _appLocalizations.onboarding_challengeCompletionDescription,
      );

  Widget get _page3 => _IntroPage(
        figure: Stack(
          clipBehavior: Clip.none,
          children: [
            const SizedBox(),
            Positioned(
              bottom: 140,
              right: 60,
              child: Assets.challenges.onboarding.starCyan.image(
                height: 40,
              ),
            ),
            Positioned(
              bottom: 110,
              right: -65,
              child: Assets.challenges.onboarding.ballCyan.image(
                height: 85,
              ),
            ),
            Positioned(
              bottom: 105,
              left: 80,
              child: Assets.challenges.onboarding.starCyan.image(height: 25),
            ),
            Positioned(
              bottom: 30,
              left: -100,
              child: Assets.challenges.onboarding.cameraCyan.image(
                height: 70,
              ),
            ),
            Positioned(
              bottom: -5,
              left: 20,
              child: Assets.challenges.onboarding.paintCyan.image(
                height: 80,
              ),
            ),
          ],
        ),
        background: Positioned.fill(
          bottom: 200,
          child: Assets.challenges.onboarding.backgroundCyan.image(
            fit: BoxFit.fitWidth,
          ),
        ),
        title: _appLocalizations.onboarding_exploreInterests,
        subtitle: widget.isChallengeEducation
            ? _appLocalizations.onboarding_browseChallengesDescription
            : _appLocalizations
                .onboarding_diveIntoPassionsWithFriendsDescription,
      );

  late final _pages = [
    if (widget.isEntryPoint || !widget.isChallengeEducation) _page1,
    _page2,
    _page3,
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
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
          alignment: Alignment.bottomCenter,
          children: [
            background,
            Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                figure,
                const SizedBox(height: 52),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: FontFamily.slussenExpanded,
                    fontSize: 24,
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 64),
                  child: Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(height: 135),
              ],
            ),
          ],
        ),
      );
}
