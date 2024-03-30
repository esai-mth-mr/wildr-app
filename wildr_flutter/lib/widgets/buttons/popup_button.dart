import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PopupButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final Color color;
  final Color textColor;

  const PopupButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.color = WildrColors.primaryColor,
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) => Container(
      width: Get.width,
      margin: EdgeInsets.symmetric(horizontal: Get.width * 0.05),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30.0),
          ),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: Get.width * 0.03),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 15.0.w,
            ),
          ),
        ),
      ),
    );
}
