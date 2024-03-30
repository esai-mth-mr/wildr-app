import 'dart:io';

import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CoverImageOrPreset extends StatelessWidget {
  final bool showEditIcon;
  final bool rounded;
  final bool bordered;
  final VoidCallback? onTap;
  final String? imageFilePath;
  final ChallengeCoverPresetEnum? preset;

  const CoverImageOrPreset({
    super.key,
    this.showEditIcon = false,
    this.rounded = false,
    this.bordered = false,
    this.onTap,
    this.imageFilePath,
    this.preset,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final BorderRadiusGeometry? borderRadius =
        rounded ? const BorderRadius.all(Radius.circular(4)) : null;
    final Border? border = bordered
        ? Border.all(
            color: isDark ? WildrColors.white : WildrColors.black,
            width: 3,
          )
        : null;
    final Decoration decoration;

    if (imageFilePath?.isNotEmpty ?? false) {
      decoration = BoxDecoration(
        image: DecorationImage(
          image: FileImage(File(imageFilePath!)),
          fit: BoxFit.cover,
        ),
        border: border,
        borderRadius: borderRadius,
      );
    } else if (preset != null) {
      decoration = BoxDecoration(
        image:
            DecorationImage(image: preset!.image.provider(), fit: BoxFit.cover),
        border: border,
        borderRadius: borderRadius,
      );
    } else {
      final backgroundColor =
          isDark ? WildrColors.gray900 : WildrColors.gray100;

      decoration = BoxDecoration(
        color: backgroundColor,
        border: border,
        borderRadius: borderRadius,
      );
    }

    return GestureDetector(
      onTap: onTap,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            Container(
              // duration: const Duration(milliseconds: 200),
              decoration: decoration,
              width: double.infinity,
              height: double.infinity,
            ),
            if (imageFilePath == null && preset == null)
              const Center(
                child: WildrIcon(
                  WildrIcons.picture,
                  color: WildrColors.gray700,
                ),
              ),
            if (showEditIcon)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: WildrIcon(
                  WildrIcons.edit,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? WildrColors.white.withOpacity(0.6)
                      : WildrColors.black.withOpacity(0.6),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
