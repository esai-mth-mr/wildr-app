import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class BigButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color color;
  final Color textColor;
  final String? icon;
  final Widget? child;
  final double? buttonWidth;

  @Deprecated('Use PrimaryCta instead')
  const BigButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.buttonWidth,
  })  : color = WildrColors.primaryColor,
        textColor = Colors.white,
        child = null,
        icon = null;

  const BigButton.child({
    super.key,
    required this.child,
    required this.onPressed,
    this.color = WildrColors.primaryColor,
    this.textColor = Colors.white,
    this.buttonWidth,
  })  : text = '',
        icon = null;

  const BigButton.secondary({
    super.key,
    required this.text,
    required this.onPressed,
    this.buttonWidth,
  })  : color = WildrColors.secondaryColor,
        textColor = WildrColors.primaryColor,
        child = null,
        icon = null;

  const BigButton.destructive({
    super.key,
    required this.text,
    required this.onPressed,
    this.buttonWidth,
  })  : color = const Color(0xFFFF3F56),
        textColor = Colors.white,
        child = null,
        icon = null;

  const BigButton.icon({
    super.key,
    required this.text,
    required this.onPressed,
    required this.icon,
    this.buttonWidth,
  })  : color = WildrColors.primaryColor,
        textColor = Colors.white,
        child = null;

  Text _textWidget() => Text(
      text,
      textAlign: TextAlign.center,
      style: TextStyle(
        color: textColor,
        fontWeight: FontWeight.w500,
        fontSize: 17,
      ),
    );

  @override
  Widget build(BuildContext context) => SizedBox(
      width: buttonWidth ?? Get.width,
      // margin: EdgeInsets.symmetric(horizontal: Get.width * 0.05),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30.0),
          ),
        ),
        child: Padding(
          padding:
          EdgeInsets.symmetric(vertical: (buttonWidth ?? Get.width) * 0.03),
          child: child ??
              ((icon == null)
                  ? _textWidget()
                  : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  WildrIcon(
                    icon!,
                    color: textColor,
                  ),
                  const SizedBox(width: 10),
                  _textWidget(),
                ],
              )),
        ),
      ),
    );
}
