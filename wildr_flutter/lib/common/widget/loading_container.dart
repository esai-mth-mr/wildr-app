import 'package:flutter/material.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class LoadingContainer extends StatelessWidget {
  const LoadingContainer({
    super.key,
    this.height,
    this.width,
  });

  final double? height;
  final double? width;

  @override
  Widget build(BuildContext context) => Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10.0),
        color: WildrColors.gray100,
      ),
    );
}
