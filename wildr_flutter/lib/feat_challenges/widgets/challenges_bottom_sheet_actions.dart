import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_base.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeBottomSheetActions extends StatelessWidget {
  final List<Widget> actions;

  const ChallengeBottomSheetActions({super.key, required this.actions});

  @override
  Widget build(BuildContext context) => ChallengesBottomSheetBase(
      shrinkWrap: true,
      child: ListView.separated(
        padding: const EdgeInsets.all(10),
        primary: false,
        shrinkWrap: true,
        itemBuilder: (context, index) => actions[index],
        separatorBuilder: (context, index) => const SizedBox(height: 8),
        itemCount: actions.length,
      ),
    );
}

class ActionListTile extends StatelessWidget {
  final Widget? leading;
  final String title;
  final VoidCallback onTap;
  final Color? titleColor;
  final bool centerTtile;

  const ActionListTile({
    super.key,
    this.leading,
    required this.title,
    required this.onTap,
    this.titleColor,
    this.centerTtile = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return ListTile(
      tileColor: isDark ? WildrColors.gray1000 : WildrColors.gray100,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      leading: leading,
      horizontalTitleGap: 10,
      minLeadingWidth: 0,
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 16,
          color: titleColor,
        ),
        textAlign: centerTtile ? TextAlign.center : null,
      ),
      onTap: onTap,
    );
  }
}
