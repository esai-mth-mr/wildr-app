import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_actions.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_base.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengesBottomSheetConfirmation extends StatelessWidget {
  final String title;
  final String description;
  final String confirmText;
  final VoidCallback onConfirm;

  const ChallengesBottomSheetConfirmation({
    super.key,
    required this.title,
    required this.description,
    required this.confirmText,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) => ChallengesBottomSheetBase(
      shrinkWrap: true,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 8),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  description,
                  style: const TextStyle(color: WildrColors.gray500),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Column(
              children: [
                ActionListTile(
                  title: confirmText,
                  titleColor: WildrColors.redWarning,
                  centerTtile: true,
                  onTap: onConfirm,
                ),
                const SizedBox(height: 8),
                ActionListTile(
                  title: AppLocalizations.of(context)!.comm_cap_cancel,
                  centerTtile: true,
                  onTap: Navigator.of(context).pop,
                ),
              ],
            ),
          ),
        ],
      ),
    );
}
