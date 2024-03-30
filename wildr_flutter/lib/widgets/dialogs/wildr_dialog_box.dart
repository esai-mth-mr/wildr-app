import 'package:align_positioned/align_positioned.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/buttons/popup_button.dart';
import 'package:wildr_flutter/widgets/dialogs/notched_container.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

enum WildrDialogBoxType { ICON, SVG, IMAGE, EMOJI }

class WildrDialogBox extends StatelessWidget {
  const WildrDialogBox.emoji({
    super.key,
    required this.title,
    required this.bodyText,
    required this.buttonText,
    required this.onPressed,
    required String this.emoji,
    this.shouldShowSecondaryButton = false,
    this.secondaryButtonOnPressed,
    this.secondaryButtonText,
    this.secondaryButtonTextColor = Colors.white,
  })  : _wildrDialogBoxType = WildrDialogBoxType.EMOJI,
        imagePath = null,
        icon = null,
        iconColor = null,
        assert(
          shouldShowSecondaryButton &&
              secondaryButtonText != null &&
              secondaryButtonOnPressed != null,
          'Please provide all secondary parameters ',
        );

  const WildrDialogBox.icon({
    super.key,
    required this.title,
    required this.bodyText,
    required this.buttonText,
    required this.onPressed,
    required String this.icon,
    this.iconColor,
    this.shouldShowSecondaryButton = false,
    this.secondaryButtonText,
    this.secondaryButtonOnPressed,
    this.secondaryButtonTextColor,
  })  : _wildrDialogBoxType = WildrDialogBoxType.ICON,
        imagePath = null,
        emoji = null;

  const WildrDialogBox.svg({
    super.key,
    required this.title,
    required this.bodyText,
    required this.buttonText,
    required this.onPressed,
    required String this.imagePath,
    this.shouldShowSecondaryButton = false,
    this.secondaryButtonOnPressed,
    this.secondaryButtonText,
    this.secondaryButtonTextColor = Colors.white,
  })  : _wildrDialogBoxType = WildrDialogBoxType.SVG,
        icon = null,
        emoji = null,
        iconColor = null,
        assert(
          shouldShowSecondaryButton &&
              secondaryButtonText != null &&
              secondaryButtonOnPressed != null,
          'Please provide all secondary parameters ',
        );

  const WildrDialogBox.image({
    super.key,
    required this.title,
    required this.bodyText,
    required this.buttonText,
    required this.onPressed,
    required String this.imagePath,
    this.shouldShowSecondaryButton = false,
    this.secondaryButtonOnPressed,
    this.secondaryButtonText,
    this.secondaryButtonTextColor = Colors.white,
  })  : _wildrDialogBoxType = WildrDialogBoxType.IMAGE,
        icon = null,
        emoji = null,
        iconColor = null,
        assert(
          shouldShowSecondaryButton &&
              (secondaryButtonText != null && secondaryButtonOnPressed != null),
          'Please provide all secondary parameters ',
        );
  final String title;
  final String bodyText;
  final String buttonText;
  final VoidCallback onPressed;
  final String? icon;
  final Color? iconColor;
  final String? emoji;
  final String? imagePath;
  final WildrDialogBoxType _wildrDialogBoxType;
  final bool shouldShowSecondaryButton;
  final String? secondaryButtonText;
  final VoidCallback? secondaryButtonOnPressed;
  final Color? secondaryButtonTextColor;

  Container _headerIcon() {
    final double size = Get.width * 0.11;
    late Widget child;
    switch (_wildrDialogBoxType) {
      case WildrDialogBoxType.ICON:
        child = WildrIcon(
          icon!,
          color: iconColor ??
              (Get.theme.brightness != Brightness.dark
                  ? WildrColors.darkCardColor
                  : WildrColors.offWhite),
          size: size,
        );
      case WildrDialogBoxType.SVG:
        child = SvgPicture.asset(
          imagePath!,
          height: size,
        );
      case WildrDialogBoxType.IMAGE:
        child = Image.asset(
          imagePath!,
          height: size,
          fit: BoxFit.contain,
        );
      case WildrDialogBoxType.EMOJI:
        child = WildrIconPng(
          emoji!,
          size: Get.width * 0.08,
        );
    }
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: Get.theme.brightness == Brightness.dark
            ? WildrColors.darkCardColor
            : WildrColors.offWhite,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: child,
      ),
    );
  }

  Column _bodyText(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 20.0.w,
            ),
          ),
          Text(
            bodyText,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12.0.w,
            ),
          ),
          const SizedBox(height: 20),
          PopupButton(
            text: buttonText,
            onPressed: onPressed,
          ),
          if (shouldShowSecondaryButton)
            TextButton(
              onPressed: secondaryButtonOnPressed,
              child: Text(
                'Skip',
                style: TextStyle(color: secondaryButtonTextColor),
              ),
            ),
        ],
      );

  @override
  Widget build(BuildContext context) => Dialog(
        backgroundColor: Colors.transparent,
        child: AlignPositioned.relative(
          container: NotchedContainer(context, child: _bodyText(context)),
          child: _headerIcon(),
          moveByContainerHeight: -0.5,
        ),
      );
}
