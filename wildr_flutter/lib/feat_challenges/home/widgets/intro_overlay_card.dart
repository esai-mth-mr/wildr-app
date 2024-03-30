import 'package:flutter/material.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class IntroOverlayCard extends StatelessWidget {
  final String title;
  final String description;
  final bool arrowOnTop;
  final bool arrowOnLeft;

  const IntroOverlayCard({
    super.key,
    required this.title,
    required this.description,
    required this.arrowOnTop,
    required this.arrowOnLeft,
  });

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment:
            arrowOnLeft ? CrossAxisAlignment.start : CrossAxisAlignment.end,
        children: [
          if (arrowOnTop)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: CustomPaint(
                painter: _TrianglePainter(fillColor: WildrColors.emerald900),
                child: SizedBox(
                  height: 10,
                  width: 20,
                ),
              ),
            ),
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.8,
            ),
            padding: const EdgeInsets.all(20),
            margin: const EdgeInsets.symmetric(horizontal: 6),
            decoration: BoxDecoration(
              color: WildrColors.emerald900,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: FontFamily.slussenExpanded,
                    fontSize: 18,
                    color: WildrColors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: const TextStyle(
                    color: WildrColors.white,
                  ),
                ),
              ],
            ),
          ),
          if (!arrowOnTop)
            const Padding(
              padding: EdgeInsets.only(left: 20),
              child: CustomPaint(
                painter: _TrianglePainter(
                  fillColor: WildrColors.emerald900,
                  isFlipped: true,
                ),
                child: SizedBox(
                  height: 10,
                  width: 25,
                ),
              ),
            ),
        ],
      );
}

class _TrianglePainter extends CustomPainter {
  final Color fillColor;
  final bool isFlipped;

  const _TrianglePainter({required this.fillColor, this.isFlipped = false});

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;

    final path = Path();

    if (isFlipped) {
      // Triangle pointing downwards
      path
        ..moveTo(0, 0) // Start from the top left
        ..lineTo(size.width, 0) // Go to the top right
        ..lineTo(size.width * 0.5, size.height); // Go to the bottom middle
    } else {
      // Triangle pointing upwards
      path
        ..moveTo(size.width * 0.5, 0) // Start from the top middle
        ..lineTo(0, size.height) // Go to the bottom left
        ..lineTo(size.width, size.height); // Go to the bottom right
    }

    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
