import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class ConsentButtons extends StatefulWidget {
  final VoidCallback onPressed;

  const ConsentButtons({super.key, required this.onPressed});

  @override
  State<ConsentButtons> createState() => _ConsentButtonsState();
}

class _ConsentButtonsState extends State<ConsentButtons> {
  @override
  Widget build(BuildContext context) => Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Spacer(),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: Get.width * 0.1),
          child: Common().legalMinimumAgeConsentCopy(context),
        ),
        const Spacer(),
        PrimaryCta(
          text: 'Continue',
          onPressed: widget.onPressed,
          filled: true,
        ),
        const Spacer(),
      ],
    );
}
