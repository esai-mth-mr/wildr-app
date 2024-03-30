import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrVerifyIntroPage extends StatelessWidget {
  const WildrVerifyIntroPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: _buildAppBar(context),
        body: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildVerificationStack(context),
            SizedBox(height: Get.height * 0.06),
            _letsDoItBtn(context),
            SizedBox(height: Get.height * 0.02),
          ],
        ),
        bottomNavigationBar: _buildBottomNav(context),
      );

  AppBar _buildAppBar(BuildContext context) => AppBar(
        elevation: 0,
        title: Text(AppLocalizations.of(context)!.wildr_verify_wildrVerified),
      );

  Widget _buildVerificationStack(BuildContext context) => Expanded(
        child: Stack(
          children: [
            const WildrIcon(
              WildrIcons.whyWildr,
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
              title:
                  AppLocalizations.of(context)!.wildr_verify_whyWildrVerified,
            ),
            const SizedBox(height: 4),
            SubTitleText(
              subTitle: AppLocalizations.of(context)!
                  .wildr_verify_verificationSystemExplanation,
            ),
          ],
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

  Widget _letsDoItBtn(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: SizedBox(
          width: double.infinity,
          child: PrimaryCta(
            onPressed: () {
              context.pushRoute(const WildrVerifyIdentityPageRoute());
            },
            text: AppLocalizations.of(context)!.wildr_verify_letsDoIt,
            filled: true,
          ),
        ),
      );
}

class TitleText extends StatelessWidget {
  final String title;
  final double fontSize;

  const TitleText({super.key, required this.title, this.fontSize = 24});

  @override
  Widget build(BuildContext context) => Text(
        title,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontFamily: FontFamily.slussenExpanded,
          fontSize: fontSize,
          color: WildrColors.lightDarkTextModeColor(context),
        ),
      );
}

class SubTitleText extends StatelessWidget {
  final String subTitle;
  final double fontSize;
  final Color? color;

  const SubTitleText({
    super.key,
    required this.subTitle,
    this.color,
    this.fontSize = 16,
  });

  @override
  Widget build(BuildContext context) => Text(
        subTitle,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontWeight: FontWeight.w500,
          fontFamily: FontFamily.satoshi,
          fontSize: fontSize,
          color: color ?? WildrColors.wildrVerifySubTextColor(),
        ),
      );
}

class ElevatedBtn extends StatelessWidget {
  final String btnTitle;
  final VoidCallback onTap;
  final TextStyle? btnTitleTextStyle;

  const ElevatedBtn({
    super.key,
    required this.btnTitle,
    required this.onTap,
    this.btnTitleTextStyle,
  });

  @override
  Widget build(BuildContext context) => ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: WildrColors.emerald800, // Text color
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25.0), // Rounded corners
          ),
          padding: const EdgeInsets.all(15.0), // Button padding
        ),
        child: Text(btnTitle, style: btnTitleTextStyle), // Button text
      );
}
