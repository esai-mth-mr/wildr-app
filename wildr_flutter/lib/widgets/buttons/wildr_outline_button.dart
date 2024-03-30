import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

enum _ButtonType { TEXT, CHILD, ICON, EMOJI }

class WildrOutlineButton extends StatelessWidget {
  final String text;
  final TextStyle? textStyle;
  final VoidCallback? onPressed;
  final double? width;
  final String? icon;
  final String? emoji;
  final double? emojiSize;
  final double? iconSize;
  final Widget? child;
  final _ButtonType _buttonType;
  final TextAlign? textAlign;

  const WildrOutlineButton({
    super.key,
    required this.text,
    this.onPressed,
    this.textStyle,
    this.width,
    this.textAlign = TextAlign.center,
  })  : _buttonType = _ButtonType.TEXT,
        icon = null,
        child = null,
        emoji = null,
        iconSize = null,
        emojiSize = null;

  const WildrOutlineButton.child({
    super.key,
    this.onPressed,
    required Widget this.child,
    this.width,
  })  : _buttonType = _ButtonType.CHILD,
        text = '',
        icon = null,
        emoji = null,
        iconSize = null,
        emojiSize = null,
        textStyle = null,
        textAlign = null;

  const WildrOutlineButton.icon({
    super.key,
    required this.text,
    this.onPressed,
    required String this.icon,
    this.iconSize,
    this.width,
  })  : _buttonType = _ButtonType.ICON,
        child = null,
        emoji = null,
        emojiSize = null,
        textStyle = null,
        textAlign = null;

  const WildrOutlineButton.emoji({
    super.key,
    required this.text,
    this.onPressed,
    required String this.emoji,
    this.emojiSize = 15,
    this.width,
  })  : _buttonType = _ButtonType.EMOJI,
        child = null,
        icon = null,
        iconSize = null,
        textStyle = null,
        textAlign = null;

  Widget getChild() {
    switch (_buttonType) {
      case _ButtonType.TEXT:
        return Text(text, textAlign: textAlign, style: textStyle);
      case _ButtonType.CHILD:
        return child!;
      case _ButtonType.ICON:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            WildrIcon(icon!, size: iconSize),
            Text(text),
          ],
        );
      case _ButtonType.EMOJI:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: WildrIconPng(emoji!, size: emojiSize),
            ),
            Text(text),
          ],
        );
    }
  }

  @override
  Widget build(BuildContext context) => OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: WildrColors.primaryColor),
        ),
        onPressed: onPressed,
        child: SizedBox(
          width: width,
          child: getChild(),
        ),
      );
}
