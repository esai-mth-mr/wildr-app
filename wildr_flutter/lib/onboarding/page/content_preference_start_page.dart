import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_events.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_carousel_data.dart';
import 'package:wildr_flutter/onboarding/skeleton/single_page_onboarding_skeleton.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/blur_gradient_overlay.dart';
import 'package:wildr_flutter/widgets/buttons/two_big_buttons.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

// Unused
class ContentPreferenceStartPage extends StatelessWidget {
  final bool fromSignUp;
  final bool removeSkipButton;

  const ContentPreferenceStartPage({
    super.key,
    this.fromSignUp = false,
    this.removeSkipButton = false,
  });

  @override
  Widget build(BuildContext context) => SinglePageOnboardingSkeleton(
        OnboardingCarouselData.child(
          child: SizedBox(
            width: Get.width,
            child: BlurGradientOverlay(
              end: Alignment.topCenter,
              begin: const Alignment(0, -0.6),
              child: BlurGradientOverlay(
                begin: const Alignment(0, 0.6),
                child: Image.asset(
                  'assets/onboarding/preferences_start.png',
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          title:
              AppLocalizations.of(context)!.onboarding_personalizedJustForYou,
          body: AppLocalizations.of(context)!
              .onboarding_helpChooseContentForInterestsPrompt,
          bigButton: removeSkipButton
              ? PrimaryCta(
                  text: AppLocalizations.of(context)!.onboarding_cap_start,
                  onPressed: () => context.pushRoute(
                    ContentPreferenceOnboardingPageRoute(shouldShowSkip: true),
                  ),
                  filled: true,
                )
              : null,
          twoBigButtons: !removeSkipButton
              ? TwoBigButtons(
                  leftButtonData: LeftButtonData(
                    text: AppLocalizations.of(context)!.login_signup_cap_skip,
                    onPressed: () {
                      Navigator.of(context).pop();
                      Common()
                          .mainBloc(context)
                          .add(UpdateUserCategoryInterestsEvent([]));
                      Common()
                          .mainBloc(context)
                          .add(UpdateUserPostTypeInterestsEvent([]));
                      Common().showSnackBar(
                        context,
                        kUpdatePreferences,
                      );
                    },
                  ),
                  rightButtonData: RightButtonData(
                    text: AppLocalizations.of(context)!.onboarding_cap_start,
                    onPressed: () => context.pushRoute(
                      ContentPreferenceOnboardingPageRoute(
                        shouldShowSkip: true,
                      ),
                    ),
                  ),
                )
              : null,
        ),
        heightPercentage: 0.6,
        showAppbarBackButton: !fromSignUp,
      );
}
