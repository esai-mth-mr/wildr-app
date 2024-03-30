import 'package:flutter/material.dart';

class LeadingWidgetSnackBar extends SnackBar {
  LeadingWidgetSnackBar({
    super.key,
    required String text,
    required Widget leading,
    Color backgroundColor = Colors.transparent,
    super.duration = const Duration(seconds: 3),
  }) : super(
          backgroundColor: const Color(0xFF343837).withOpacity(0.6),
          content: Row(
            children: [
              leading,
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  text,
                  textAlign: TextAlign.left,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        );
}
