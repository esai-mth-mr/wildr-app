import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class NotchedContainer extends StatelessWidget {
  final BuildContext context;
  final Widget child;

  const NotchedContainer(this.context, {super.key, required this.child});

  @override
  Widget build(BuildContext context) => ClipPath(
        clipper: NotchedContainerClipper(
          right: (Get.width - 150) / 2,
          holeRadius: 70,
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(
              Radius.circular(15),
            ),
            color: Get.theme.brightness == Brightness.dark
                ? WildrColors.darkCardColor
                : WildrColors.offWhite,
          ),
          width: Get.width,
          padding:
              const EdgeInsets.only(left: 15, right: 15, top: 40, bottom: 20),
          child: child,
        ),
      );
}

class NotchedContainerClipper extends CustomClipper<Path> {
  NotchedContainerClipper({required this.right, required this.holeRadius});

  final double right;
  final double holeRadius;

  @override
  Path getClip(Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width - right - holeRadius, 0.0)
      ..arcToPoint(
        Offset(size.width - right, 0),
        clockwise: false,
        radius: const Radius.circular(4),
      )
      ..lineTo(size.width, 0.0)
      ..lineTo(size.width, size.height)
      ..lineTo(size.width - right, size.height)
      ..lineTo(0.0, size.height)
      ..close();
    return path;
  }

  @override
  bool shouldReclip(NotchedContainerClipper oldClipper) => true;
}
