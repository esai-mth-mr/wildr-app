import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tile.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeParticipantListTile extends StatelessWidget {
  final WildrUser user;
  final int submissions;
  final bool isCreator;
  final Color? backgroundColor;
  final Post? post;
  final ChallengeParticipant participant;
  final SingleChallengeBloc bloc;

  ChallengeParticipantListTile(
    this.participant, {
    super.key,
    this.backgroundColor,
    required this.bloc,
  })  : user = participant.user,
        post = participant.post,
        isCreator = participant.isCreator ?? false,
        submissions = participant.entryCount ?? 0;

  Widget _avatar(context) => Padding(
      padding: const EdgeInsets.all(3.0),
      child: Common().avatarFromUser(
        context,
        user,
        ringDiff: 0.1,
        ringWidth: 1.5,
        shouldNavigateToCurrentUser: false,
      ),
    );

  Widget _handleWidget() => Text(
      '@${user.handle}',
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
    );

  Widget _nameWidget() {
    final subtitleText = '${user.name} ${isCreator ? '• Creator' : ''}';
    return Text(
      subtitleText,
    );
  }

  List<BoxShadow>? _boxShadow() {
    final firstLayer = BoxShadow(
      color: WildrColors.gray500,
      offset: Offset(1.5.w, 1.0.w),
    );
    final secondLayer = BoxShadow(
      color: WildrColors.gray700,
      offset: Offset(3.5.w, 3.0.w),
    );
    return submissions < 2
        ? null
        : submissions == 2
            ? [firstLayer]
            : [
                secondLayer,
                firstLayer,
              ];
  }

  Widget _textWithPost(BuildContext context) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          submissions == 0 ? '' : submissions.toString(),
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        const SizedBox(width: 16),
        if (submissions == 0) const SizedBox() else GestureDetector(
                onTap: () {
                  Common().mainBloc(context).logCustomEvent(
                    ChallengesAnalyticsEvents.kTapChallengeParticipant,
                    {
                      ChallengesAnalyticsParameters.kChallengeId:
                          bloc.challengeId,
                      ChallengesAnalyticsParameters.kUserId: user.id,
                    },
                  );
                  context.pushRoute(
                    ChallengePostEntriesPageRoute(
                      challengeId: bloc.challengeId,
                      fetchPostsUserId: participant.user.id,
                      participantHandle: user.handle,
                      bloc: bloc,
                    ),
                  );
                },
                child: Container(
                  width: 45,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: _boxShadow(),
                  ),
                  child: post != null
                      ? PostTile(
                          post!,
                          isDense: true,
                          maxFontSize: 10,
                          maxLines: 2,
                          shouldShowCarouselIcon: false,
                          performantClip: false,
                          clipRadius: 10,
                        )
                      : const SizedBox(),
                ),
              ),
      ],
    );

  Widget get _shimmerTile => Common().wrapInShimmer(
      ListTile(
        contentPadding: const EdgeInsets.only(right: 8),
        dense: false,
        minVerticalPadding: 0,
        visualDensity: VisualDensity.comfortable,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        leading: const CircleAvatar(
          backgroundColor: WildrColors.emerald900,
          radius: 25,
        ),
        title: Container(
          width: 40,
          height: 16.0,
          color: WildrColors.emerald900,
        ),
        subtitle: Container(
          width: 40,
          height: 12.0,
          color: WildrColors.emerald900,
        ),
        trailing: Container(
          width: 45,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: WildrColors.gray700,
                offset: Offset(3.5.w, 3.0.w),
              ),
              BoxShadow(
                color: WildrColors.gray600,
                offset: Offset(2.0.w, 1.0.w),
              ),
            ],
            color: WildrColors.emerald900,
          ),
        ),
      ),
    );

  @override
  Widget build(BuildContext context) {
    if (participant.isLoading) {
      return _shimmerTile;
    }
    final creatorBackgroundCardColor = isCreator
        ? ChallengesStyles.of(context).leaderboardCreatorTileColor
        : ChallengesStyles.of(context).leaderboardParticipantTileColor;
    return ListTile(
      onTap: () {
        Common().openProfilePage(context, user.id);
      },
      contentPadding: const EdgeInsets.only(right: 12),
      dense: false,
      minVerticalPadding: 0,
      visualDensity: VisualDensity.comfortable,
      tileColor: backgroundColor ?? creatorBackgroundCardColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      horizontalTitleGap: 8,
      leading: _avatar(context),
      title: _handleWidget(),
      subtitle: _nameWidget(),
      trailing: _textWithPost(context),
    );
  }
}
