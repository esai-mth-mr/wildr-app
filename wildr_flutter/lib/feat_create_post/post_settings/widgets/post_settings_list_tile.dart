import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostSettingsListTile extends StatelessWidget {
  final String text;
  final String decisionValue;
  final VoidCallback onPressed;

  const PostSettingsListTile({
    super.key,
    required this.text,
    required this.decisionValue,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) => ListTile(
      contentPadding: const EdgeInsets.only(right: 8, top: 10),
      dense: true,
      minLeadingWidth: 1,
      title: Text(
        text,
        style: TextStyle(
          fontSize: 14.0.sp,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: ConstrainedBox(
        constraints:
            BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Flexible(
              child: Text(
                decisionValue,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: WildrColors.textColorStrong(),
                  fontWeight: FontWeight.w500,
                  fontSize: 12.0.sp,
                ),
                textAlign: TextAlign.end,
              ),
            ),
            const SizedBox(width: 10),
            const WildrIcon(
              WildrIcons.chevron_right_filled,
              size: 20,
            ),
          ],
        ),
      ),
      onTap: onPressed,
    );
}
