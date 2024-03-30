import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/feat_profile/profile/animated_profile_pic.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class VerifiedProfileBottomSheet extends StatefulWidget {
  const VerifiedProfileBottomSheet({super.key});

  @override
  State<VerifiedProfileBottomSheet> createState() =>
      _VerifiedProfileBottomSheetState();
}

class _VerifiedProfileBottomSheetState
    extends State<VerifiedProfileBottomSheet> {
  bool isMainProfile = true;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            BottomSheetTopDivider(
              widthFactor: 0.1,
              color: WildrColors.wildrVerifyBottomSheetTopDivider(context),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 100.0,
              height: 100.0,
              child: AnimatedProfilePic(
                front: const WildrIconPng(WildrIconsPng.mainProfile),
                rear: const WildrIconPng(WildrIconsPng.secondaryProfile),
                shouldWrapWithRing: false,
                onSwitchCard: () {
                  if (!mounted) return;
                  setState(() {
                    isMainProfile = !isMainProfile;
                  });
                },
              ),
            ),
            const SizedBox(height: 4),
            SubTitleText(
              subTitle: isMainProfile
                  ? _appLocalizations.wildr_verify_mainProfilePhotoDescription
                  : _appLocalizations
                      .wildr_verify_secondaryVerifiedProfilePhotoDescription,
              fontSize: 14,
            ),
            const SizedBox(height: 16),
            TitleText(
              title: _appLocalizations.wildr_verify_whereWillThisBeShown,
              fontSize: 18,
            ),
            const SizedBox(
              height: 4,
            ),
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                text: '',
                style: DefaultTextStyle.of(context).style,
                children: [
                  TextSpan(
                    text: _appLocalizations
                        .wildr_verify_swipeRightForVerifiedPhotoExplanation,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                      color: WildrColors.gray500,
                    ),
                  ),
                  TextSpan(
                    text: _appLocalizations.wildr_verify_swipeToTryOut,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: WildrColors.lightDarkTextModeColor(context),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
            Align(
              alignment: Alignment.bottomCenter,
              child: GestureDetector(
                onTap: () {
                  Navigator.pop(context);
                },
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    _appLocalizations.wildr_verify_cap_close,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: WildrColors.lightDarkTextModeColor(context),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
}
