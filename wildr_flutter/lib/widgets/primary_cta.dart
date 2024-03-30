import 'package:flutter/material.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PrimaryCta extends StatelessWidget {
  final String text;
  final RichText? richText;
  final Widget? icon;
  final VoidCallback? onPressed;
  final VoidCallback? onLongPress;
  final bool filled;
  final bool outline;
  final bool fillWidth;
  final bool disabled;
  final Widget? child;
  final double? width;
  final Color? backgroundColor;
  final Color? textColor;

  const PrimaryCta({
    super.key,
    required this.text,
    this.icon,
    this.onPressed,
    this.onLongPress,
    this.filled = false,
    this.outline = false,
    this.fillWidth = false,
    this.width,
    this.richText,
    this.child,
    this.disabled = false,
    this.backgroundColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    return SizedBox(
      width: _getWidth(),
      child: TextButton(
        style: TextButton.styleFrom(
          disabledBackgroundColor:
              backgroundColor ?? WildrColors.emerald800.withOpacity(0.5),
          backgroundColor: filled
              ? backgroundColor ?? WildrColors.emerald800
              : Colors.transparent,
          splashFactory: NoSplash.splashFactory,
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontFamily: FontFamily.satoshi,
          ),
          foregroundColor:
              isDarkMode || filled ? WildrColors.white : WildrColors.black,
          shape: (filled || outline)
              ? StadiumBorder(
                  side: outline
                      ? BorderSide(
                          color: backgroundColor != null
                              ? backgroundColor!
                              : isDarkMode
                                  ? WildrColors.white
                                  : WildrColors.black,
                        )
                      : BorderSide.none,
                )
              : null,
          // According to the material spec, disabled text should have an
          //opacity of 38%.
          // ref: https://m2.material.io/design/color/text-legibility.html#text-backgrounds
          disabledForegroundColor:
              (isDarkMode || filled ? WildrColors.white : WildrColors.black)
                  .withOpacity(0.38),
        ),
        onPressed: disabled ? null : onPressed,
        onLongPress: disabled ? null : onLongPress,
        child: child ??
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  richText ??
                      Text(
                        text,
                        style: TextStyle(color: textColor),
                      ),
                  if (icon != null) ...[
                    const SizedBox(width: 8),
                    icon!,
                  ],
                ],
              ),
            ),
      ),
    );
  }

  double? _getWidth() {
    if (width != null) return width;
    if (fillWidth) return double.infinity;
    return null;
  }
}
