import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DeleteDraftPostBottomSheet extends StatelessWidget {
  final VoidCallback? onCancelTap;
  final VoidCallback onDeleteTap;
  final String title;

  const DeleteDraftPostBottomSheet({
    super.key,
    required this.title,
    this.onCancelTap,
    required this.onDeleteTap,
  });

  @override
  Widget build(BuildContext context) => Container(
        padding: EdgeInsets.only(bottom: 20.0.w),
        decoration: BoxDecoration(
          color: WildrColors.createPostBGColor(),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(15),
            topRight: Radius.circular(15),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _SaveToDraftBottomSheetHeaderTitle(title: title),
            _BottomButton(
              title: AppLocalizations.of(context)!.commentsAndReplies_delete,
              itemColor: WildrColors.red,
              onItemTap: () {
                Navigator.pop(context);
                onDeleteTap();
              },
            ),
            const SizedBox(
              height: 4,
            ),
            _BottomButton(
              title: AppLocalizations.of(context)!.comm_cap_cancel,
              itemColor: WildrColors.appBarTextColor(),
              onItemTap: () {
                Navigator.pop(context);
                if (onCancelTap != null) {
                  onCancelTap!.call();
                }
              },
            ),
          ],
        ),
      );
}

class _SaveToDraftBottomSheetHeaderTitle extends StatelessWidget {
  final String title;

  const _SaveToDraftBottomSheetHeaderTitle({
    required this.title,
  });

  @override
  Widget build(BuildContext context) => Column(
        children: [
          BottomSheetTopDivider(
            widthFactor: 0.1,
            color: WildrColors.textPostBGColor(context),
          ),
          SizedBox(height: 5.0.h),
          Text(
            title,
            style: TextStyle(
              fontSize: 18.0.sp,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      );
}

class _BottomButton extends StatelessWidget {
  final String title;
  final VoidCallback? onItemTap;
  final Color itemColor;

  const _BottomButton({
    required this.title,
    required this.onItemTap,
    required this.itemColor,
  });

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 10.0, right: 10.0, top: 4.0),
        child: SizedBox(
          width: double.infinity,
          height: Get.height * 0.06,
          child: TextButton(
            onPressed: onItemTap,
            style: TextButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              backgroundColor: WildrColors.bottomSheetCardBGColor(),
            ),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 16.0,
                fontWeight: FontWeight.w500,
                color: itemColor,
              ),
            ),
          ),
        ),
      );
}
