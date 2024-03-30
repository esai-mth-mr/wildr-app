import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrVerifyPhotoRulesPage extends StatelessWidget {
  const WildrVerifyPhotoRulesPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          elevation: 0,
          title: Text(AppLocalizations.of(context)!.wildr_verify_photoRules),
        ),
        body: SafeArea(
          child: Column(
            children: [
              SizedBox(height: Get.height * 0.03),
              const Center(child: WildrIcon(WildrIcons.dontDo)),
              const SizedBox(height: 16),
              TitleText(
                title: AppLocalizations.of(context)!
                    .wildr_verify_selfieContentGuidelines,
              ),
              const SizedBox(height: 10),
              SubTitleText(
                subTitle: AppLocalizations.of(context)!
                    .wildr_verify_rejectedPhotoContentExplanation,
              ),
              const SizedBox(height: 16),
              _wildrVerifyRulesItems(context),
              const Spacer(),
              const _BottomNav(),
            ],
          ),
        ),
      );

  Widget _wildrVerifyRulesItems(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            color: WildrColors.wildrVerifiedRulesBg(),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(
            children: [
              _ruleItem(
                WildrIcons.sunGlasses,
                AppLocalizations.of(context)!.wildr_verify_cap_sunglasses,
              ),
              const SizedBox(height: 16),
              _ruleItem(
                WildrIcons.maskIcon,
                AppLocalizations.of(context)!.wildr_verify_partiallyHiddenFace,
              ),
              const SizedBox(height: 16),
              _ruleItem(
                WildrIcons.moreThanOnePersonIcon,
                AppLocalizations.of(context)!.wildr_verify_moreThan1Person,
              ),
              const SizedBox(height: 16),
              _ruleItem(
                WildrIcons.nudityIcon,
                AppLocalizations.of(context)!.wildr_verify_cap_nudity,
              ),
              const SizedBox(height: 16),
              _ruleItem(
                WildrIcons.close,
                AppLocalizations.of(context)!.wildr_verify_poorLighting,
              ),
            ],
          ),
        ),
      );

  Widget _ruleItem(String icon, String subTitle) => Row(
        children: [
          WildrIcon(
            icon,
            color: WildrColors.textColorSoft(),
          ),
          const SizedBox(width: 20),
          SubTitleText(
            subTitle: subTitle,
            fontSize: 18,
            color: WildrColors.textColor(),
          ),
        ],
      );
}

class _BottomNav extends StatefulWidget {
  const _BottomNav();

  @override
  State<_BottomNav> createState() => _BottomNavState();
}

class _BottomNavState extends State<_BottomNav> {
  bool ignoringButtons = false;

  @override
  Widget build(BuildContext context) => IgnorePointer(
        ignoring: ignoringButtons,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: PrimaryCta(
                onPressed: _takeImage,
                text: AppLocalizations.of(context)!.wildr_verify_takePhoto,
                filled: true,
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: _pickImage,
              child: Padding(
                padding: EdgeInsets.only(bottom: Get.height * 0.05),
                child: Text(
                  AppLocalizations.of(context)!.wildr_verify_uploadPhoto,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: WildrColors.textColorStrong(context),
                  ),
                ),
              ),
            ),
          ],
        ),
      );

  Future<void> _takeImage() async {
    ignoringButtons = true;
    final File? file = await Common().pickProfileImageAndCrop(
      context,
      ImageSource.camera,
    );
    if (file != null) {
      await context.pushRoute(
        ReviewPhotoPageRoute(imageFile: file),
      );
    }
    ignoringButtons = false;
  }

  Future<void> _pickImage() async {
    try {
      ignoringButtons = true;
      final File? file =
          await Common().pickProfileImageAndCrop(context, ImageSource.gallery);
      if (file != null) {
        await context.pushRoute(
          ReviewPhotoPageRoute(imageFile: file),
        );
      }
      ignoringButtons = false;
    } catch (e) {
      Common().showErrorSnackBar(
        AppLocalizations.of(context)!
            .wildr_verify_enablePhotoPermissionsInstruction,
        context,
      );
    }
  }
}
