import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

abstract class TwoBigButtonData {
  String text;
  VoidCallback onPressed;
  Color color;
  Color textColor;

  TwoBigButtonData(this.text, this.onPressed, this.color, this.textColor);
}

class LeftButtonData extends TwoBigButtonData {
  LeftButtonData({
    required String text,
    required VoidCallback onPressed,
    Color color = WildrColors.secondaryColor,
    Color textColor = WildrColors.primaryColor,
  }) : super(text, onPressed, color, textColor);
}

class RightButtonData extends TwoBigButtonData {
  RightButtonData({
    required String text,
    required VoidCallback onPressed,
    Color color = WildrColors.primaryColor,
    Color textColor = Colors.white,
  }) : super(text, onPressed, color, textColor);
}

class TwoBigButtons extends StatelessWidget {
  final LeftButtonData leftButtonData;
  final RightButtonData rightButtonData;

  const TwoBigButtons({
    required this.leftButtonData,
    required this.rightButtonData,
    super.key,
  });

  ElevatedButton _getButton(TwoBigButtonData twoBigButtonData) =>
      ElevatedButton(
        onPressed: twoBigButtonData.onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: twoBigButtonData.color,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30.0),
          ),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(
            vertical: Get.width * 0.03,
          ),
          child: Text(
            twoBigButtonData.text,
            style: TextStyle(
              color: twoBigButtonData.textColor,
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: Get.width / 2.5,
            margin: EdgeInsets.only(left: Get.width * 0.05),
            child: _getButton(leftButtonData),
          ),
          SizedBox(
            width: Get.width * 0.05,
          ),
          Container(
            width: Get.width / 2.5,
            margin: EdgeInsets.only(right: Get.width * 0.05),
            child: _getButton(rightButtonData),
          ),
        ],
      );
}
