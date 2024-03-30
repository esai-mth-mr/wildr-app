import 'dart:io';

import 'package:flutter/material.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CoverImageOrGradient extends StatelessWidget {
  final bool showEditIcon;
  final bool isRounded;
  final bool isBordered;
  final VoidCallback? onTap;
  final String? imageFilePath;
  final List<Color>? colorGradient;

  const CoverImageOrGradient({
    super.key,
    this.showEditIcon = false,
    this.isRounded = false,
    this.isBordered = false,
    this.onTap,
    this.imageFilePath,
    this.colorGradient,
  });

  @override
  Widget build(BuildContext context) {
    final BoxDecoration decoration = _buildDecoration();

    return GestureDetector(
      onTap: onTap,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              decoration: decoration,
              width: double.infinity,
              height: double.infinity,
            ),
            if (imageFilePath?.isNotEmpty != true &&
                colorGradient?.isNotEmpty != true)
              _imageIcon(),
            if (showEditIcon) _editIcon(),
          ],
        ),
      ),
    );
  }

  Widget _editIcon() => const Padding(
        padding: EdgeInsets.all(8.0),
        child: Icon(
          Icons.edit_outlined,
          size: 18,
          color: WildrColors.gray500,
        ),
      );

  Widget _imageIcon() => const Center(
        child: Icon(
          Icons.image,
          color: WildrColors.gray700,
        ),
      );

  BoxDecoration _buildDecoration() {
    final BorderRadiusGeometry? borderRadius =
        isRounded ? const BorderRadius.all(Radius.circular(4)) : null;
    final Border? border = isBordered
        ? Border.all(
            color: WildrColors.white,
            width: 3,
          )
        : null;

    if (imageFilePath?.isNotEmpty ?? false) {
      return BoxDecoration(
        image: DecorationImage(
          image: FileImage(File(imageFilePath!)),
          fit: BoxFit.cover,
        ),
        border: border,
        borderRadius: borderRadius,
      );
    } else if (colorGradient?.isNotEmpty ?? false) {
      return BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colorGradient!,
        ),
        border: border,
        borderRadius: borderRadius,
      );
    } else {
      return BoxDecoration(
        gradient: DEFAULT_TEXT_POST_GRADIENT,
        border: border,
        borderRadius: borderRadius,
      );
    }
  }
}
