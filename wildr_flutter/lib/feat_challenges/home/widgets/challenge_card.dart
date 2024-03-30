import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/challenge_cover.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenge_participants_preview.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';

class ChallengeCard extends StatelessWidget {
  final Challenge challenge;
  final bool dense;
  final VoidCallback? onTap;

  const ChallengeCard({
    required this.challenge,
    super.key,
    this.dense = false,
    this.onTap,
  });

  Widget _cover() => ChallengeCoverCard(
        challenge: challenge,
        showDaysRemaining: false,
        roundedCorners: true,
      );

  Widget _duration(textStyle, context) => Text(
        challenge.dateText(shouldTruncate: true, context: context) ?? '-',
        style: textStyle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      );

  Widget _infoRow(context) {
    final styles = ChallengesStyles.of(context);
    final textStyle = dense
        ? styles.subtitle2TextStyle.copyWith(fontSize: 12)
        : styles.subtitle2TextStyle;
    return Padding(
      padding: EdgeInsets.only(top: dense ? 6 : 8),
      child: Row(
        children: [
          Flexible(
            child: Text(
              challenge.author.handle,
              style: textStyle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            ' • ',
            style: textStyle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          _duration(textStyle, context),
        ],
      ),
    );
  }

  Widget _name(context) {
    final styles = ChallengesStyles.of(context);
    return Padding(
      padding: EdgeInsets.only(top: dense ? 2 : 4),
      child: Text(
        challenge.name,
        style: dense ? styles.headline3TextStyle : styles.headline2TextStyle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _participantsPreview() {
    if (challenge.previewParticipants == null) {
      return SizedBox(
        height: dense ? 16 : 28,
      );
    }
    return Padding(
      padding: EdgeInsets.only(top: dense ? 2 : 4),
      child: ChallengeParticipantsPreview(
        preview: challenge.previewParticipants!,
        dense: dense,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _cover()),
            _infoRow(context),
            _name(context),
            _participantsPreview(),
          ],
        ),
      );
}
