import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';

class WildrIcon extends StatelessWidget {
  const WildrIcon(
    this.icon, {
    super.key,
    this.size,
    this.alignment = Alignment.center,
    this.color,
  });
  final String icon;
  final double? size;
  final Alignment alignment;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    Color iconColor;
    if (color == null) {
      iconColor = Theme.of(context).brightness == Brightness.dark
          ? Colors.white
          : Colors.black;
    } else {
      iconColor = color!;
    }
    return SvgPicture.asset(
      icon,
      height: size,
      colorFilter: ColorFilter.mode(iconColor, BlendMode.srcIn),
      alignment: alignment,
    );
  }
}
