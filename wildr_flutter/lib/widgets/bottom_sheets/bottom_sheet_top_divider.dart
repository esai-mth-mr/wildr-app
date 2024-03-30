import 'package:flutter/material.dart';
import 'package:get/get.dart';

class BottomSheetTopDivider extends StatelessWidget {
  final double? widthFactor;
  final Color? color;
  const BottomSheetTopDivider({super.key, this.widthFactor, this.color});

  @override
  Widget build(BuildContext context) => FractionallySizedBox(
      widthFactor: widthFactor ?? 0.25,
      child: Container(
        margin: const EdgeInsets.symmetric(
          vertical: 12.0,
        ),
        child: Container(
          height: 5.0,
          decoration: BoxDecoration(
            color: color ?? Get.theme.cardColor,
            borderRadius: const BorderRadius.all(Radius.circular(2.5)),
          ),
        ),
      ),
    );
}
