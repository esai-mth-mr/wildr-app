import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class UploadPermissionBottomSheet extends StatelessWidget {
  final String title;
  final String subTitle;
  final String btnTitle;
  final Color? btnColor;
  final VoidCallback onPressed;
  final bool isCameraTab;

  const UploadPermissionBottomSheet({
    super.key,
    required this.title,
    required this.subTitle,
    required this.onPressed,
    this.btnColor,
    this.isCameraTab = false,
    required this.btnTitle,
  });

  Widget _goToSettingButton(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(25),
              side: BorderSide(color: WildrColors.appBarTextColor(context)),
            ),
          ),
          child: Text(
            btnTitle,
            style: TextStyle(
              color: btnColor ?? WildrColors.appBarTextColor(),
              fontFamily: FontFamily.inter,
            ),
          ),
        ),
      );

  Widget _subTitleText() => Text(
        subTitle,
        style: const TextStyle(
          color: WildrColors.gray500,
          fontWeight: FontWeight.w500,
          fontSize: 16,
          fontFamily: FontFamily.satoshi,
        ),
      );

  Widget _titleText() => Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 20,
          fontFamily: FontFamily.slussenExpanded,
        ),
      );

  Widget _galleryIcon() => WildrIcon(
        isCameraTab ? WildrIcons.camera_outline : WildrIcons.galleryIcon,
        size: 50,
    color: Colors.white,
      );

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _galleryIcon(),
            const SizedBox(height: 16),
            _titleText(),
            const SizedBox(height: 8),
            _subTitleText(),
            const SizedBox(height: 16),
            _goToSettingButton(context),
          ],
        ),
      );
}
