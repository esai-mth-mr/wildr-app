import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/verified_profile_bottom_sheet.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrVerifyIdentityPage extends StatelessWidget {
  const WildrVerifyIdentityPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          elevation: 0,
          title: Text(AppLocalizations.of(context)!.wildr_verify_step1Of2),
        ),
        body: SafeArea(
          child: Stack(
            children: [
              Container(
                width: Get.width,
                padding: EdgeInsets.only(top: Get.height * 0.1),
                child: const WildrIcon(
                  WildrIcons.identityIcon,
                  alignment: Alignment.topCenter,
                  color: WildrColors.emerald800,
                ),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: Get.height * 0.5),
                  _title(context),
                  SizedBox(height: Get.height * 0.01),
                  _subtitle(context),
                  SizedBox(height: Get.height * 0.04),
                  _banner(context),
                  const Spacer(),
                  _nextBtn(context),
                  SizedBox(height: Get.height * 0.05),
                ],
              ),
            ],
          ),
        ),
      );

  Widget _title(BuildContext context) => TitleText(
        title: AppLocalizations.of(context)!.wildr_verify_verifyYourIdentity,
      );

  Widget _subtitle(BuildContext context) => SubTitleText(
        subTitle:
            AppLocalizations.of(context)!.wildr_verify_faceMatchingInstructions,
      );

  Widget _banner(context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: GestureDetector(
          onTap: () {
            showModalBottomSheet(
              backgroundColor: WildrColors.wildrVerifiedRulesBg(context),
              isScrollControlled: false,
              context: context,
              builder: (context) => const VerifiedProfileBottomSheet(),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: WildrColors.wildrVerifyIdentity(context: context),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const WildrIcon(
                  WildrIcons.exclamation_circle_outline,
                  color: WildrColors.gray600,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SubTitleText(
                    subTitle: AppLocalizations.of(context)!
                        .wildr_verify_profilePhotoVisibilityExplanation,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  Widget _nextBtn(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: PrimaryCta(
          text: AppLocalizations.of(context)!.comm_cap_next,
          onPressed: () =>
              context.pushRoute(const WildrVerifyPhotoRulesPageRoute()),
          filled: true,
        ),
      );
}
