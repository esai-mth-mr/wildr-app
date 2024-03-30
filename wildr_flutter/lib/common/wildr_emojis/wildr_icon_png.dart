import 'package:flutter/material.dart';

class WildrIconPng extends StatelessWidget {
  const WildrIconPng(
    this.emoji, {
    super.key,
    this.size,
    this.alignment = Alignment.center,
    this.color,
  });
  final String emoji;
  final double? size;
  final Alignment alignment;
  final Color? color;

  @override
  Widget build(BuildContext context) => Image.asset(
      emoji,
      height: size,
      alignment: alignment,
      fit: BoxFit.contain,
    );
}
