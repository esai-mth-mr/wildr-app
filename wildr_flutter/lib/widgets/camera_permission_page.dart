import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CameraPermissionPage extends StatelessWidget {
  final String title;
  final String subTitle;
  final String actionButtonText;
  final Function()? onActionButtonTap;
  const CameraPermissionPage({
    super.key,
    required this.title,
    required this.subTitle,
    required this.actionButtonText,
    required this.onActionButtonTap,
  });

  Widget _cameraMicrophoneIcon() => SizedBox(
      width: Get.width * 0.3,
      height: Get.height * 0.22,
      child: const WildrIconPng(
        WildrIconsPng.cameraPermission,
      ),
    );

  Widget _titleText(BuildContext context) => Text(
      title,
      textAlign: TextAlign.center,
      style: TextStyle(
        color: WildrColors.lightDarkTextModeColor(context),
        fontFamily: FontFamily.satoshi,
        fontWeight: FontWeight.w700,
        fontSize: 18,
      ),
    );

  Widget _subTitleText(BuildContext context) => Text(
      subTitle,
      textAlign: TextAlign.center,
      style: const TextStyle(
        color: WildrColors.gray500,
        fontFamily: FontFamily.satoshi,
        fontWeight: FontWeight.w500,
        fontSize: 14,
      ),
    );

  Widget _actionButtonText(BuildContext context) => GestureDetector(
      onTap: () {
        if (onActionButtonTap != null) {
          onActionButtonTap!.call();
        }
      },
      child: Text(
        actionButtonText,
        style: const TextStyle(
          color: WildrColors.emerald800,
          fontFamily: FontFamily.satoshi,
          fontWeight: FontWeight.w700,
          fontSize: 14,
        ),
      ),
    );

  @override
  Widget build(BuildContext context) => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _cameraMicrophoneIcon(),
          _titleText(context),
          SizedBox(
            height: Get.height * 0.02,
          ),
          _subTitleText(context),
          SizedBox(
            height: Get.height * 0.04,
          ),
          _actionButtonText(context),
        ],
      ),
    );
}
