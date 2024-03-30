import 'package:flutter/material.dart';

const Duration defaultDuration = Duration(milliseconds: 750);

class SlideAnimation extends StatefulWidget {
  const SlideAnimation({
    super.key,
    required this.child,
    required this.startLocation,
    required this.endLocation,
    this.curve = Curves.easeIn,
    this.duration = defaultDuration,
    this.delay = Duration.zero,
  });

  final Widget child;
  final Offset startLocation;
  final Offset endLocation;
  final Curve curve;
  final Duration duration;
  final Duration delay;

  @override
  State<SlideAnimation> createState() => _SlideOutAnimationState();
}

class _SlideOutAnimationState extends State<SlideAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> offset;

  bool _hidden = false;

  @override
  void initState() {
    _controller = AnimationController(duration: widget.duration, vsync: this);
    offset = Tween<Offset>(begin: widget.startLocation, end: widget.endLocation)
        .animate(
      CurvedAnimation(
        parent: _controller,
        curve: widget.curve,
      ),
    );
    _hidden = widget.delay != Duration.zero;
    Future<void>.delayed(widget.delay).then((_) {
      if (mounted) {
        _hidden = false;
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
      builder: (context, child) => _hidden
          ? Container()
          : Positioned(
              top: offset.value.dy,
              left: offset.value.dx,
              child: child ?? widget.child,
            ),
    );
}
