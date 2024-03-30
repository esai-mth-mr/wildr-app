import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class _GradientPainter extends CustomPainter {
  _GradientPainter({
    required this.gradient,
    required this.strokeWidth,
    required this.borderRadius,
  });

  final Gradient gradient;
  final double strokeWidth;
  final double borderRadius;
  final Paint paintObject = Paint();

  @override
  void paint(Canvas canvas, Size size) {
    final Rect innerRect = Rect.fromLTRB(
      strokeWidth,
      strokeWidth,
      size.width - strokeWidth,
      size.height - strokeWidth,
    );
    final RRect innerRoundedRect =
        RRect.fromRectAndRadius(innerRect, Radius.circular(borderRadius));
    final Rect outerRect = Offset.zero & size;
    final RRect outerRoundedRect =
        RRect.fromRectAndRadius(outerRect, Radius.circular(borderRadius));
    paintObject.shader = gradient.createShader(outerRect);
    final Path borderPath =
        _calculateBorderPath(outerRoundedRect, innerRoundedRect);
    canvas.drawPath(borderPath, paintObject);
  }

  Path _calculateBorderPath(RRect outerRRect, RRect innerRRect) {
    final Path outerRectPath = Path()..addRRect(outerRRect);
    final Path innerRectPath = Path()..addRRect(innerRRect);
    return Path.combine(PathOperation.difference, outerRectPath, innerRectPath);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}

class _GradientBorderContainer extends StatelessWidget {
  _GradientBorderContainer({
    required gradient,
    required this.child,
    this.strokeWidth = 4,
    this.borderRadius = 64,
    required this.padding,
    required this.height,
    required this.width,
    required this.opacity,
  }) : painter = _GradientPainter(
          gradient: gradient,
          strokeWidth: strokeWidth,
          borderRadius: borderRadius,
        );
  final _GradientPainter painter;
  final Widget child;
  final double strokeWidth;
  final double borderRadius;
  final double padding;
  final double opacity;
  final double height;
  final double width;

  @override
  Widget build(BuildContext context) => Stack(
        alignment: Alignment.center,
        children: [
          Opacity(
            opacity: opacity,
            child: CustomPaint(
              painter: painter,
              child: SizedBox(height: height + padding, width: width + padding),
            ),
          ),
          Container(
            padding: EdgeInsets.all(padding - 12),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: WildrColors.primaryColor,
            ),
            child: child,
          ),
        ],
      );
}

class PulsatingWildrLogo extends StatefulWidget {
  const PulsatingWildrLogo({super.key});

  @override
  State<PulsatingWildrLogo> createState() => _PulsatingWildrLogoState();
}

class _PulsatingWildrLogoState extends State<PulsatingWildrLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation _animation;

  @override
  void initState() {
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    super.initState();
    _animationController
      ..forward()
      ..addListener(() {
        if (_animationController.isCompleted) {
          _animationController.repeat(reverse: true, min: 0);
        }
      });
    _animation = Tween(begin: 0.4, end: 1.0).animate(_animationController)
      ..addListener(() => setState(() {}));
  }

  @override
  Widget build(BuildContext context) => _GradientBorderContainer(
        opacity: _animation.value,
        gradient: const LinearGradient(
          colors: [
            WildrColors.primaryColor,
            WildrColors.yellow,
            WildrColors.errorColor,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomLeft,
        ),
        padding: 25,
        height: 80,
        width: 80,
        child: RepaintBoundary(
          child: SvgPicture.asset(
            'assets/icon/reaction_real.svg',
            height: 60,
            colorFilter: const ColorFilter.mode(
              Colors.white,
              BlendMode.srcIn,
            ),
          ),
        ),
      );

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
}
