import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_base.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_confirmation.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

/// A bottom sheet specific to the form/textfields in the create challenge page
/// to ensure a consistent style.
class CreateChallengeBottomSheet extends StatelessWidget {
  final String title;
  final String subtitle;
  final double heightFactor;
  final VoidCallback onSave;
  final bool canSave;
  final bool hasEdited;
  final bool popOnSave;

  /// An optional action widget, like a button, to place above the save button.
  final Widget? action;
  final Widget child;
  final Widget? belowSaveButton;

  const CreateChallengeBottomSheet({
    super.key,
    required this.title,
    required this.subtitle,
    required this.heightFactor,
    required this.onSave,
    this.popOnSave = true,
    this.canSave = true,
    this.hasEdited = false,
    this.action,
    this.belowSaveButton,
    required this.child,
  });

  void _showLeaveConfirmationBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor:
          ChallengesStyles.of(context).bottomSheetActionsBackgroundColor,
      builder: (context) => ChallengesBottomSheetConfirmation(
        title:
            AppLocalizations.of(context)!.challenge_discardChangesQuestionMark,
        description: AppLocalizations.of(context)!.challenge_editWarning,
        confirmText: AppLocalizations.of(context)!.challenge_discardChanges,
        onConfirm: () {
          Navigator.pop(context);
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final styles = ChallengesStyles.of(context);

    return ChallengesBottomSheetBase(
      heightFactor: heightFactor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            onPressed: hasEdited
                ? () => _showLeaveConfirmationBottomSheet(context)
                : Navigator.of(context).pop,
            constraints: const BoxConstraints(),
            icon: const WildrIcon(WildrIcons.closeIcon),
          ),
          Expanded(
            child: ListView(
              primary: false,
              padding: const EdgeInsets.all(12),
              children: [
                Text(
                  title,
                  style: styles.headline2TextStyle,
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  style: styles.subtitleTextStyle,
                ),
                const SizedBox(height: 32),
                child,
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              12,
              24,
              12,
              MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: Column(
              children: [
                if (action != null) ...[
                  action!,
                  const SizedBox(height: 12),
                ],
                PrimaryCta(
                  filled: true,
                  fillWidth: true,
                  onPressed: canSave
                      ? () {
                          onSave();
                          if (popOnSave) context.popRoute();
                        }
                      : null,
                  text: AppLocalizations.of(context)!.comm_cap_save,
                ),
                if (belowSaveButton != null) ...[
                  belowSaveButton!,
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
