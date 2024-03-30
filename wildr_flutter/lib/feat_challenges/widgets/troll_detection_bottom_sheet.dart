import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_base.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengesBottomSheetTrollDetectionReview extends StatelessWidget {
  final VoidCallback onContinueAnyways;

  const ChallengesBottomSheetTrollDetectionReview({
    super.key,
    required this.onContinueAnyways,
  });

  @override
  Widget build(BuildContext context) {
    final roundedRectangleBorder = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
      side: const BorderSide(
        color: WildrColors.gray700,
      ),
    );

    return ChallengesBottomSheetBase(
      shrinkWrap: true,
      child: Column(
        children: [
          AppBar(
            leading: IconButton(
              onPressed: context.popRoute,
              constraints: const BoxConstraints(),
              icon: const WildrIcon(WildrIcons.closeIcon),
            ),
            centerTitle: true,
            title: Text(
              AppLocalizations.of(context)!.challenge_reviewComment,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLocalizations.of(context)!.challenge_trollDetectionTitle,
                  style: const TextStyle(
                    fontSize: 16,
                    color: WildrColors.yellow,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  AppLocalizations.of(context)!
                      .challenge_trollDetectionSubTitle,
                  style: TextStyle(
                    color: WildrColors.textColorStrong(context),
                  ),
                ),
                const SizedBox(height: 40),
                ListTile(
                  title: Text(
                    AppLocalizations.of(context)!.challenge_communityGuidelines,
                    style: TextStyle(
                      color: WildrColors.textColorStrong(context),
                    ),
                  ),
                  trailing: const WildrIcon(WildrIcons.chevron_right_outline),
                  shape: roundedRectangleBorder,
                  onTap: () =>
                      context.pushRoute(CommunityGuidelinesPageRoute()),
                ),
                const SizedBox(height: 12),
                ListTile(
                  title: Text(
                    AppLocalizations.of(context)!.challenge_continueAnyways,
                    style: TextStyle(
                      color: WildrColors.textColorStrong(context),
                    ),
                  ),
                  trailing: const WildrIcon(WildrIcons.chevron_right_outline),
                  shape: roundedRectangleBorder,
                  onTap: onContinueAnyways,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
