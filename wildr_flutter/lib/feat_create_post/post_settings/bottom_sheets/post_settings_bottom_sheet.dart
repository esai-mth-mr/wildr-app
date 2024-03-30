import 'package:flutter/material.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostSettingsBottomSheet extends StatelessWidget {
  final String title;
  final String subTitle;
  final Widget body;

  const PostSettingsBottomSheet({
    super.key,
    required this.title,
    required this.subTitle,
    required this.body,
  });

  @override
  Widget build(BuildContext context) => SafeArea(
      child: Container(
        padding: const EdgeInsets.only(
          bottom: 8.0,
          right: 10,
          left: 10,
        ),
        decoration: const BoxDecoration(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(15),
            topRight: Radius.circular(15),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  BottomSheetTopDivider(
                    color: WildrColors.wildrVerifiedRulesBg(),
                    widthFactor: 0.1,
                  ),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      // fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                  SizedBox(
                    height: 5.0.h,
                  ),
                  Text(
                    subTitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      // fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: WildrColors.createPostV2LabelsColor(),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const Padding(padding: EdgeInsets.only(bottom: 20)),
            body,
          ],
        ),
      ),
    );
}
