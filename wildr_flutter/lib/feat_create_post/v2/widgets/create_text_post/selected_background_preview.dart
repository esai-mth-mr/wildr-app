import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SelectedBackgroundPreview extends StatelessWidget {
  final List<Color>? colorGradient;
  final Color? backgroundColor;
  const SelectedBackgroundPreview({
    super.key,
    this.colorGradient,
    this.backgroundColor,
  });

  Decoration _buildDecoration() {
    if (colorGradient?.isNotEmpty ?? false) {
      return BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colorGradient!,
        ),
        shape: BoxShape.circle,
        border: Border.all(color: WildrColors.white),
      );
    } else {
      return BoxDecoration(
        gradient: const LinearGradient(
          colors: [WildrColors.gray900, WildrColors.gray900],
        ),
        shape: BoxShape.circle,
        border: Border.all(color: WildrColors.white),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final Decoration decoration = backgroundColor == Colors.transparent
        ? _buildDecoration()
        : BoxDecoration(
            color: backgroundColor,
            shape: BoxShape.circle,
            border: Border.all(color: WildrColors.white),
          );

    return Container(
      width: 28.0,
      height: 28.0,
      decoration: decoration,
    );
  }
}
