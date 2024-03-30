import 'package:flutter/material.dart';

const Duration defaultDuration = Duration(milliseconds: 700);

class FadeOutAnimation extends StatefulWidget {
  const FadeOutAnimation({
    super.key,
    required this.child,
    this.duration = defaultDuration,
    this.delay = Duration.zero,
  });

  final Widget child;
  final Duration duration;
  final Duration delay;

  @override
  State<FadeOutAnimation> createState() => _FadeOutAnimationState();
}

class _FadeOutAnimationState extends State<FadeOutAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _animation = Tween<double>(begin: 1, end: 00)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
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
