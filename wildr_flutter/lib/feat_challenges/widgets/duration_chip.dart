import 'package:flutter/material.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeDurationChip extends StatefulWidget {
  final Challenge challenge;
  final EdgeInsets? margin;
  final bool truncate;
  final bool shouldShowCompleteStartDate;

  const ChallengeDurationChip(
    this.challenge, {
    super.key,
    this.margin,
    this.truncate = false,
    this.shouldShowCompleteStartDate = false,
  });

  @override
  State<ChallengeDurationChip> createState() => _ChallengeDurationChipState();
}

class _ChallengeDurationChipState extends State<ChallengeDurationChip> {
  late final challenge = widget.challenge;
  bool showEndDate = false;

  String? text() => challenge.dateText(
      showEndDate: showEndDate,
      shouldTruncate: widget.truncate,
      context: context,
      shouldShowCompleteStartDate: widget.shouldShowCompleteStartDate,
    );

  Widget _body() => GestureDetector(
      onTap: () {
        if (widget.truncate) return;

        Common().mainBloc(context).logCustomEvent(
          ChallengesAnalyticsEvents.kTapChallengeDate,
          {
            ChallengesAnalyticsParameters.kChallengeId: challenge.id,
          },
        );

        setState(() {
          showEndDate = !showEndDate;
        });
      },
      child: Container(
        margin: widget.margin,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        decoration: BoxDecoration(
          color: WildrColors.black.withOpacity(0.35),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const WildrIcon(
              WildrIcons.clock_outline,
              size: 16,
              color: WildrColors.white,
            ),
            const SizedBox(width: 5),
            Text(
              text() ?? '- - -',
              style: const TextStyle(
                color: WildrColors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );

  @override
  Widget build(BuildContext context) => _body();
}
