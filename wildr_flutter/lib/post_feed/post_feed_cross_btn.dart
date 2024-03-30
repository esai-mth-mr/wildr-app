import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';

class FeedPageBackButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Color? bgColor;

  const FeedPageBackButton({required this.onPressed, this.bgColor, super.key});

  @override
  Widget build(BuildContext context) => RepaintBoundary(
      child: GestureDetector(
        onTap: onPressed,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(25),
          child: Container(
            padding: const EdgeInsets.all(10),
            color: bgColor ?? const Color(0x40000000),
            child: const WildrIcon(
              WildrIcons.chevron_left_filled,
              color: Colors.white,
              size: 25,
            ),
          ),
        ),
      ),
    );
}
