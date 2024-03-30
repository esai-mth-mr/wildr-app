import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gen/assets.gen.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ContentPreferenceFinishPage extends StatelessWidget {
  final PassFailState passFail;

  const ContentPreferenceFinishPage(this.passFail, {super.key});

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async => false,
        child: Scaffold(
          body: Padding(
            padding: EdgeInsets.only(top: Get.height * 0.14),
            child: _IntroPage(
              figure: Assets.images.youAreDoneBg.image(
                width: MediaQuery.of(context).size.width,
                fit: BoxFit.fitWidth,
              ),
              background: const SizedBox.shrink(),
              title: AppLocalizations.of(context)!.onboarding_youAreDone,
              subtitle: AppLocalizations.of(context)!
                  .onboarding_journeyOnWildrSetupMessage,
            ),
          ),
          bottomNavigationBar: Padding(
            padding: EdgeInsets.all(16.0.wh),
            child: PrimaryCta(
              text: AppLocalizations.of(context)!.comm_cap_done,
              onPressed: () {
                context.router.popUntilRoot();
              },
              filled: true,
            ),
          ),
        ),
      );
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
            Padding(
              padding: EdgeInsets.only(top: 40.0.h),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    AppLocalizations.of(context)!.onboarding_youAreDone,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontFamily: FontFamily.slussenExpanded,
                      fontSize: 36,
                      color: WildrColors.gray1200,
                    ),
                  ),
                  Text(
                    AppLocalizations.of(context)!
                        .onboarding_journeyOnWildrSetupMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontFamily: FontFamily.satoshi,
                      fontSize: 16,
                      color: WildrColors.gray1200,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
}
