import 'package:flutter/material.dart';

const Duration defaultDuration = Duration(milliseconds: 800);

class BounceInAnimation extends StatefulWidget {
  const BounceInAnimation({
    super.key,
    required this.child,
    this.duration = defaultDuration,
    this.delay = Duration.zero,
  });

  final Widget child;
  final Duration duration;
  final Duration delay;

  @override
  State<BounceInAnimation> createState() => _BounceInAnimationState();
}

class _BounceInAnimationState extends State<BounceInAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _animation = CurveTween(curve: Curves.elasticOut).animate(_controller);
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
      builder: (context, child) => Transform.scale(
        scale: _animation.value,
        child: widget.child,
      ),
      child: widget.child,
    );
}
