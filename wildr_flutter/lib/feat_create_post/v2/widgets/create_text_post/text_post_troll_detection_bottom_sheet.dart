import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class TextPostTrollDetectionBottomSheet extends StatelessWidget {
  final String title;
  final String subTitle;
  final String btnTitle;
  final String secondButtonTitle;
  final VoidCallback onPressed;
  final VoidCallback secondButtonOnPressed;

  const TextPostTrollDetectionBottomSheet({
    super.key,
    required this.title,
    required this.subTitle,
    required this.onPressed,
    required this.btnTitle,
    required this.secondButtonTitle,
    required this.secondButtonOnPressed,
  });

  Widget cautionIcon() => const WildrIconPng(
      WildrIconsPng.cautionIconTroll,
      size: 50,
    );

  Widget titleText() => Text(
      title,
      textAlign: TextAlign.center,
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 20,
        fontFamily: FontFamily.satoshi,
      ),
    );

  Widget subTitleText() => Text(
      subTitle,
      textAlign: TextAlign.center,
      style: TextStyle(
        color: WildrColors.trollDetectionSubTitle(),
        fontWeight: FontWeight.w500,
        fontSize: 16,
        fontFamily: FontFamily.satoshi,
      ),
    );

  Widget secondaryButton() => Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: GestureDetector(
        onTap: secondButtonOnPressed,
        child: Text(
          secondButtonTitle,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 17,
            fontFamily: FontFamily.satoshi,
          ),
        ),
      ),
    );

  @override
  Widget build(BuildContext context) => DecoratedBox(
      decoration: BoxDecoration(
        color: WildrColors.uploadTabPermission(),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            cautionIcon(),
            const SizedBox(height: 16),
            titleText(),
            const SizedBox(height: 8),
            subTitleText(),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 40.0.h,
              child: PrimaryCta(
                text: btnTitle,
                onPressed: onPressed,
                filled: true,
              ),
            ),
            secondaryButton(),
          ],
        ),
      ),
    );
}
