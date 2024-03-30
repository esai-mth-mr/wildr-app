import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PermissionMessageExplanation extends StatelessWidget {
  final String wildrIcon;
  final String title;
  final String message;
  final VoidCallback onAllowAccess;
  final VoidCallback onDenyAccess;

  const PermissionMessageExplanation({
    required this.wildrIcon,
    required this.title,
    required this.message,
    required this.onAllowAccess,
    required this.onDenyAccess,
    super.key,
  });

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Container(
          padding: EdgeInsets.only(
            top: 50.0.h,
            left: 15.0.w,
            right: 15.0.w,
            bottom: 15.0.h,
          ),
          height: MediaQuery.of(context).size.height -
              MediaQuery.of(context).padding.bottom,
          child: Center(
            child: Column(
              children: [
                WildrIcon(
                  wildrIcon,
                  size: 40.0.h,
                ),
                SizedBox(height: 15.0.h),
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 23.0.sp,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 15.0.h),
                Text(
                  message,
                  style: TextStyle(
                    fontSize: 13.0.sp,
                  ),
                  textAlign: TextAlign.center,
                ),
                const Spacer(),
                PrimaryCta(
                  text: AppLocalizations.of(context)!.widgets_allowAccess,
                  onPressed: onAllowAccess,
                  filled: true,
                ),
                SizedBox(
                  height: 15.0.h,
                ),
                TextButton(
                  onPressed: onDenyAccess,
                  child: Text(
                    AppLocalizations.of(context)!.widgets_DoNotAllowAccess,
                    style: TextStyle(
                      color: WildrColors.textColor(context),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
