import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrVerifyFaceVerificationPage extends StatelessWidget {
  const WildrVerifyFaceVerificationPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _buildAppBar(context),
        body: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildVerificationStack(context),
            _buildContinueButton(context),
            SizedBox(height: Get.height * 0.02),
          ],
        ),
        bottomNavigationBar: _buildBottomNav(context),
      );

  AppBar _buildAppBar(BuildContext context) => AppBar(
        elevation: 0,
        title: Text(AppLocalizations.of(context)!.wildr_verify_step2Of2),
      );

  Widget _buildVerificationStack(BuildContext context) => Expanded(
        child: Stack(
          children: [
            const WildrIcon(
              WildrIcons.hand,
              color: WildrColors.emerald800,
            ),
            _buildTitleAndSubTitle(context),
          ],
        ),
      );

  Widget _buildTitleAndSubTitle(BuildContext context) => Positioned(
        left: 0,
        right: 0,
        top: Get.height * 0.4,
        child: Column(
          children: [
            TitleText(
              title: AppLocalizations.of(context)!.wildr_verify_faceMatch,
            ),
            const SizedBox(height: 4),
            SubTitleText(
              subTitle: AppLocalizations.of(context)!
                  .wildr_verify_liveFaceMatchingExplanation,
            ),
          ],
        ),
      );

  Widget _buildContinueButton(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedBtn(
            onTap: () {
              context.pushRoute(
                const WildrFaceVerificationCameraPageRoute(),
              );
            },
            btnTitle: AppLocalizations.of(context)!.wildr_verify_cap_ok,
          ),
        ),
      );

  Widget _buildBottomNav(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: Get.height * 0.04),
        child: SubTitleText(
          subTitle: AppLocalizations.of(context)!
              .wildr_verify_continuousCameraUsageWarning,
          fontSize: 12,
        ),
      );
}
