import 'dart:math' show pi;

import 'package:flutter/material.dart';

const Duration defaultDuration = Duration(seconds: 2);

enum RotateDirection { right, left }

class RotateAnimation extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Duration delay;
  final RotateDirection rotateDirection;

  const RotateAnimation({
    super.key,
    required this.child,
    required this.rotateDirection,
    this.duration = defaultDuration,
    this.delay = Duration.zero,
  });

  @override
  State<RotateAnimation> createState() => _RotateAnimationState();
}

class _RotateAnimationState extends State<RotateAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    _controller = AnimationController(duration: widget.duration, vsync: this);
    Future<void>.delayed(widget.delay).then((_) {
      if (mounted) {
        _controller.forward();
      }
    });
    super.initState();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (_, child) => Transform.rotate(
          angle: widget.rotateDirection == RotateDirection.right
              ? _controller.value * pi * 2
              : -_controller.value * pi * 2,
          child: child,
        ),
    );
}
