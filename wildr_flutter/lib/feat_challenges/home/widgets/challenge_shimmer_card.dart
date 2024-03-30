import 'dart:math';

import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/challenge_cover.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

const shimmerPeriod = Duration(milliseconds: 2000);

class ChallengeShimmerCard extends StatelessWidget {
  final bool dense;

  const ChallengeShimmerCard({
    super.key,
    this.dense = false,
  });

  Widget _cover() => Common().clipIt(
        radius: 4,
        child: Common().wrapInShimmer(
          const ChallengeCoverCard(
            showDaysRemaining: false,
            roundedCorners: true,
          ),
        ),
      );

  Widget _circleAvatar(BuildContext context, double radius) =>
      Common().wrapInShimmer(
        CircleAvatar(
          radius: radius,
          backgroundColor: WildrColors.singleChallengeBGColor(context: context),
        ),
        context: context,
      );

  Widget _participantsAvatars(BuildContext context, int count) {
    final double radius = dense ? 8 : 14;
    return Common().wrapInShimmer(
      SizedBox(
        width: radius * min(count + 1, 4),
        child: Stack(
          children: List.generate(
            min(count, 3),
            (index) => Positioned(
              left: index * radius,
              child: _circleAvatar(context, radius),
            ),
          ),
        ),
      ),
      context: context,
    );
  }

  Widget _infoRow(BuildContext context) {
    final styles = ChallengesStyles.of(context);
    final textStyle = dense
        ? styles.subtitle2TextStyle.copyWith(fontSize: 12)
        : styles.subtitle2TextStyle;
    return Padding(
      padding: EdgeInsets.only(top: dense ? 6 : 8),
      child: Common().wrapInShimmer(
        Container(
          width: double.infinity,
          color: Colors.white,
          child: Text(
            '\n\n',
            maxLines: 1,
            style: textStyle,
          ),
        ),
        context: context,
      ),
    );
  }

  Widget _name(BuildContext context) {
    final styles = ChallengesStyles.of(context);
    return Padding(
      padding: EdgeInsets.only(top: dense ? 2 : 4),
      child: Common().wrapInShimmer(
        Container(
          color: Colors.white,
          height: dense
              ? styles.headline3TextStyle.fontSize! *
                  styles.headline3TextStyle.height!
              : styles.headline2TextStyle.fontSize! *
                  styles.headline2TextStyle.height!,
        ),
        context: context,
      ),
    );
  }

  Widget _participantsPreview(context) {
    final double height = dense ? 16 : 28;
    return Padding(
      padding: EdgeInsets.only(top: dense ? 2 : 4),
      child: Common().wrapInShimmer(
        SizedBox(
          height: height,
          child: Row(
            children: [
              _participantsAvatars(context, 2),
              const SizedBox(width: 4),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 5),
                  width: double.infinity,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _cover()),
          _infoRow(context),
          _name(context),
          _participantsPreview(context),
        ],
      );
}
