import 'package:flutter/material.dart';

class BlurGradientOverlay extends StatelessWidget {
  final Widget child;
  final List<Color> colors;
  final Alignment begin;
  final Alignment end;
  final BlendMode blendMode;

  const BlurGradientOverlay({
    super.key,
    required this.child,
    this.colors = const [Colors.black, Colors.transparent],
    this.begin = const Alignment(0, 0.7),
    this.end = Alignment.bottomCenter,
    this.blendMode = BlendMode.dstIn,
  });

  @override
  Widget build(BuildContext context) => ShaderMask(
      shaderCallback: (rect) => LinearGradient(
        begin: begin,
        end: end,
        colors: colors,
      ).createShader(Rect.fromLTRB(0, 0, rect.width, rect.height)),
      blendMode: blendMode,
      child: child,
    );
}
