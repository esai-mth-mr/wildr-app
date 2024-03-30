import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/challenge_onboarding_card.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class InteractionsCard extends StatelessWidget {
  final int maxDailyInteractionsCount;
  final VoidCallback onClose;

  const InteractionsCard({
    this.maxDailyInteractionsCount = 10,
    required this.onClose,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final interactionCount =
        context.read<SingleChallengeBloc>().challenge.interactionCount;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 8),
      child: ChallengeOnboardingCard(
        leading: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              '$interactionCount/$maxDailyInteractionsCount',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: WildrColors.white,
              ),
            ),
            SizedBox(
              height: 70,
              width: 70,
              child: CircularProgressIndicator(
                value: interactionCount / maxDailyInteractionsCount,
                color: WildrColors.white,
                backgroundColor: WildrColors.emerald700,
              ),
            ),
          ],
        ),
        title: AppLocalizations.of(context)!.challenge_todayInteractions,
        subtitle:
            AppLocalizations.of(context)!.challenge_todayInteractionsSubTitle,
        onClose: onClose,
      ),
    );
  }
}
