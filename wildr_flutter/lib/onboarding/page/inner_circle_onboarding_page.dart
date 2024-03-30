import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import 'package:wildr_flutter/bloc/theme/theme_bloc.dart';
import 'package:wildr_flutter/bloc/theme/theme_event.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_carousel_data.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_skeleton.dart';
import 'package:wildr_flutter/onboarding/widgets/consent_buttons.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/app_theme_data.dart';

class InnerCircleOnboardingPage extends StatefulWidget {
  final Function()? entryPointCallback;
  final bool isFromSettings;

  const InnerCircleOnboardingPage({
    super.key,
    this.isFromSettings = false,
    this.entryPointCallback,
  });

  @override
  State<InnerCircleOnboardingPage> createState() =>
      _InnerCircleOnboardingPageState();
}

class _InnerCircleOnboardingPageState extends State<InnerCircleOnboardingPage> {
  late List<OnboardingCarouselData> _carouselData;
  bool _consentPressed = false;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _carouselData = [
      OnboardingCarouselData.child(
        child: Stack(
          children: [
            Align(
              alignment: Alignment.topCenter,
              child: Column(
                children: [
                  Text(
                    _appLocalizations.comm_title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 42,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text(
                      _appLocalizations
                          .onboarding_toxicityFreeSocialNetworkDescription,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                    ),
                  ),
                ],
              ),
            ),
            Center(
              child: Lottie.asset(
                Get.theme.brightness == Brightness.dark
                    ? 'assets/onboarding/logo_animation_dark_mode.json'
                    : 'assets/onboarding/logo_animation_light_mode.json',
                animate: false,
              ),
            ),
          ],
        ),
        title: '',
        body: '',
        childSubBody: ConsentButtons(
          onPressed: _onConsentPressed,
        ),
      ),
      OnboardingCarouselData.lottie(
        lottieSrc: Get.theme.brightness == Brightness.dark
            ? 'assets/onboarding/toxic_free_dark_mode.json'
            : 'assets/onboarding/toxic_free_light_mode.json',
        title: _appLocalizations.onboarding_positiveSocialNetworkDescription,
        body:
            _appLocalizations.onboarding_realTimeNegativityDetectionDescription,
      ),
      OnboardingCarouselData.lottie(
        lottieSrc: Get.theme.brightness == Brightness.dark
            ? 'assets/onboarding/test.json'
            : 'assets/onboarding/test.json',
        title: _appLocalizations.onboarding_trackYourImpact,
        body:
            _appLocalizations.onboarding_behaviorRingColorVisibilityDescription,
      ),
      OnboardingCarouselData.lottie(
        lottieSrc: 'assets/onboarding/inner_circle.json',
        title: _appLocalizations.feed_innerCircle,
        body: _appLocalizations
            .onboarding_sharePersonalMomentsWithCloseOnesDescription,
      ),
      OnboardingCarouselData.lottie(
        lottieSrc: Get.theme.brightness == Brightness.dark
            ? 'assets/onboarding/welcome_with_text_dark_mode.json'
            : 'assets/onboarding/welcome_with_text_light_mode.json',
        title: _appLocalizations.onboarding_youAreReadyToGoWild,
        body:
            _appLocalizations.onboarding_celebrateAllMomentsOnWildrDescription,
        bigButton: PrimaryCta(
          text: 'Done',
          onPressed: () {
            debugPrint(
              '[MainOnboarding] Replacing route with'
              ' HomePageRoute ${widget.isFromSettings}',
            );
            Prefs.setBool(PrefKeys.kHasCompletedOnboarding, value: true);
            BlocProvider.of<ThemeBloc>(context).add(
              ThemeEvent(
                appTheme:
                    MediaQuery.of(context).platformBrightness == Brightness.dark
                        ? AppThemeEnum.DarkTheme
                        : AppThemeEnum.LightTheme,
              ),
            );
            if (widget.isFromSettings) {
              context.popRoute();
            } else {
              if (widget.entryPointCallback == null) {
                context.replaceRoute(HomePageRoute());
              } else {
                widget.entryPointCallback!();
              }
            }
          },
          filled: true,
        ),
      ),
    ];
    super.initState();
  }

  void _onConsentPressed() {
    _consentPressed = true;
    _carouselData[0] = OnboardingCarouselData.child(
      child: Stack(
        children: [
          Center(
            child: Lottie.asset(
              Get.theme.brightness == Brightness.dark
                  ? 'assets/onboarding/logo_animation_dark_mode.json'
                  : 'assets/onboarding/logo_animation_light_mode.json',
            ),
          ),
        ],
      ),
      title: _appLocalizations.onboarding_welcomeToWildr,
      body: _appLocalizations
          .onboarding_liveFreelyCelebrateWildestMomentsDescription,
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) => OnboardingSkeleton(
        _carouselData,
        heightPercentage: 0.50,
        showBackButton: false,
        disableScroll: !_consentPressed,
      );
}
