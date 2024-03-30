import 'package:flutter/material.dart';

const Duration defaultDuration = Duration(milliseconds: 1000);

class FadeInAnimation extends StatefulWidget {
  const FadeInAnimation({
    super.key,
    required this.child,
    this.duration = defaultDuration,
    this.delay = Duration.zero,
  });

  final Widget child;
  final Duration duration;
  final Duration delay;

  @override
  State<FadeInAnimation> createState() => _FadeInAnimationState();
}

class _FadeInAnimationState extends State<FadeInAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
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
  Widget build(BuildContext context) => FadeTransition(
      opacity: _animation,
      child: widget.child,
    );
}
