import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DraftActionsBottomSheet extends StatelessWidget {
  final VoidCallback saveDraftTap;
  final VoidCallback? deleteTap;
  final bool isDraftPreview;
  const DraftActionsBottomSheet({
    super.key,
    required this.saveDraftTap,
    this.deleteTap,
    this.isDraftPreview = false,
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
            if (isDraftPreview)
              BottomSheetTopDivider(
                widthFactor: 0.1,
                color: WildrColors.wildrVerifiedRulesBg(),
              )
            else
              const _SaveToDraftBottomSheetHeaderTitle(),
            _BottomButton(
              title: AppLocalizations.of(context)!.createPost_saveDraft,
              itemColor: WildrColors.appBarTextColor(),
              leadingIcon: WildrIcons.saveIcon,
              onItemTap: () {
                Navigator.pop(context);
                saveDraftTap();
              },
            ),
            _BottomButton(
              title: isDraftPreview
                  ? AppLocalizations.of(context)!.createPost_deleteDraft
                  : AppLocalizations.of(context)!.commentsAndReplies_delete,
              itemColor: WildrColors.red,
              leadingIcon: WildrIcons.deleteIcon,
              onItemTap: () {
                Navigator.pop(context);
                if (deleteTap != null) {
                  deleteTap!.call();
                }
              },
            ),
          ],
        ),
      );
}

class _SaveToDraftBottomSheetHeaderTitle extends StatelessWidget {
  const _SaveToDraftBottomSheetHeaderTitle();

  @override
  Widget build(BuildContext context) => Column(
        children: [
          const BottomSheetTopDivider(
            widthFactor: 0.1,
            color: WildrColors.gray900,
          ),
          SizedBox(height: 5.0.h),
          Text(
            AppLocalizations.of(context)!.createPost_deleteDraftWithFile,
            style: TextStyle(
              fontSize: 18.0.sp,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 5.0.h),
          Text(
            AppLocalizations.of(context)!.createPost_confirmDiscardEditsMessage,
            style: TextStyle(
              fontSize: 14.0.sp,
              fontWeight: FontWeight.w500,
              color: WildrColors.gray500,
            ),
          ),
        ],
      );
}

class _BottomButton extends StatelessWidget {
  final String title;
  final String leadingIcon;
  final VoidCallback? onItemTap;
  final Color itemColor;

  const _BottomButton({
    required this.title,
    required this.leadingIcon,
    this.onItemTap,
    required this.itemColor,
  });

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onItemTap,
        child: Padding(
          padding: const EdgeInsets.only(left: 10.0, right: 10.0, top: 8.0),
          child: Container(
            height: 54,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: WildrColors.bottomSheetCardBGColor(),
            ),
            child: Row(
              children: [
                const SizedBox(width: 20.0),
                WildrIcon(
                  leadingIcon,
                  color: itemColor,
                ),
                const SizedBox(
                  width: 10.0,
                ),
                Text(
                  title, // Add your desired text here
                  style: TextStyle(
                    fontSize: 16.0,
                    fontWeight: FontWeight.w500,
                    color: itemColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
