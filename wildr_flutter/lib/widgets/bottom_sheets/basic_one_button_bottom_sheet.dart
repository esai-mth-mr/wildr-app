import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/buttons/popup_button.dart';

class BasicOneButtonBottomSheet extends StatelessWidget {
  final String title;
  final String body;
  final VoidCallback onPressed;
  final String buttonText;

  const BasicOneButtonBottomSheet({
    super.key,
    required this.title,
    required this.body,
    required this.onPressed,
    this.buttonText = 'Confirm',
  });

  Padding _title() => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Text(
        title,
        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18.0.w),
        textAlign: TextAlign.center,
      ),
    );

  Padding _body() => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Text(
        body,
        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12.0.w),
        textAlign: TextAlign.center,
      ),
    );

  Padding _button() => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: PopupButton(text: buttonText, onPressed: onPressed),
    );

  SizedBox _heightSpacing([double height = 5]) => SizedBox(height: height);

  @override
  Widget build(BuildContext context) => DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.background,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(15),
          topRight: Radius.circular(15),
        ),
      ),
      child: SafeArea(
        child: SizedBox(
          height: Get.height * 0.25,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              const BottomSheetTopDivider(),
              _title(),
              _heightSpacing(),
              _body(),
              _heightSpacing(),
              _button(),
              _heightSpacing(),
            ],
          ),
        ),
      ),
    );
}
