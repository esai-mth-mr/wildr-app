import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeParticipantsPreview extends StatelessWidget {
  final ChallengePreviewParticipants preview;
  final bool dense;

  const ChallengeParticipantsPreview({
    super.key,
    required this.preview,
    this.dense = false,
  });

  Widget _circleAvatar(BuildContext context, double radius, WildrUser user) {
    final double stroke = dense ? 1 : 2;
    return CircleAvatar(
      radius: radius,
      backgroundColor: WildrColors.singleChallengeBGColor(context: context),
      child: Common().avatarFromUser(
        null,
        user,
        shouldShowRing: false,
        radius: radius - stroke,
      ),
    );
  }

  Widget _participantsAvatars(BuildContext context, List<WildrUser> users) {
    final double radius = dense ? 10 : 14;
    return SizedBox(
      width: radius * min(users.length + 1, 4),
      child: Stack(
        children: users
            .sublist(0, min(users.length, 3))
            .mapIndexed(
              (index, participant) => Positioned(
                left: index * radius,
                child: _circleAvatar(context, radius, participant),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _displayText(BuildContext context) {
    final mutedTextStyle = ChallengesStyles.of(context).subtitle2TextStyle;
    return Flexible(
      child: Text(
        preview.displayText ?? '--',
        style: dense
            ? mutedTextStyle.copyWith(
                fontSize: 12,
                height: 1,
              )
            : mutedTextStyle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final double height = dense ? 22 : 28;

    /// If there aren't enough participants to show the avatar group, return an
    /// empty sized box with the proper height to keep the layout consistent.
    if ((preview.participants ?? []).isEmpty) return SizedBox(height: height);
    final List<WildrUser> participants = preview.participants ?? [];
    return SizedBox(
      height: height,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (participants.isNotEmpty)
            _participantsAvatars(context, participants),
          const SizedBox(width: 4),
          _displayText(context),
        ],
      ),
    );
  }
}
