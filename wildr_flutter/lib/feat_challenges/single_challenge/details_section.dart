import 'dart:math';

import 'package:flutter/cupertino.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/widgets/participants_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenge_participants_preview.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';
import 'package:wildr_flutter/widgets/text/expandable_text.dart';

class SingleChallengeDetailsSection extends StatefulWidget {
  final Challenge challenge;
  final SingleChallengeBloc bloc;
  final VoidCallback onJoinChallengePressed;
  final VoidCallback onCreatePostPressed;
  final VoidCallback onChatPressed;
  final VoidCallback onSharePressed;
  final VoidCallback onMorePressed;
  final bool isGeneratingInviteCode;

  const SingleChallengeDetailsSection(
    this.challenge, {
    super.key,
    required this.bloc,
    required this.onJoinChallengePressed,
    required this.onCreatePostPressed,
    required this.onChatPressed,
    required this.onSharePressed,
    required this.onMorePressed,
    this.isGeneratingInviteCode = false,
  });

  @override
  State<SingleChallengeDetailsSection> createState() =>
      _SingleChallengeDetailsSectionState();
}

class _SingleChallengeDetailsSectionState
    extends State<SingleChallengeDetailsSection> {
  String get _title => widget.challenge.name;

  Widget _challengeName() {
    final styles = ChallengesStyles.of(context);
    return Text(_title, style: styles.headline2TextStyle);
  }

  Widget _authorHandle() {
    final styles = ChallengesStyles.of(context);
    return Text(
      widget.challenge.author.handle,
      style: styles.subtitleTextStyle.copyWith(
        fontWeight: FontWeight.bold,
      ),
    );
  }

  List<Widget> _description() {
    if (widget.challenge.description == null) return [];
    return [
      const SizedBox(height: 12),
      _ExpandableDescription(description: widget.challenge.description!),
    ];
  }

  //TODO: Rohan, add pagination support
  void _showParticipantsBottomSheet() {
    Common().mainBloc(context).logCustomEvent(
      ChallengesAnalyticsEvents.kTapChallengeParticipants,
      {
        ChallengesAnalyticsParameters.kChallengeId: widget.challenge.id,
      },
    );

    showModalBottomSheet(
      barrierColor: WildrColors.black.withOpacity(0.6),
      isScrollControlled: true,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => FractionallySizedBox(
        heightFactor: 0.7,
        child: ParticipantsBottomSheet(
          widget.challenge.id,
          widget.bloc,
        ),
      ),
    );
  }

  Widget _participantsPreview() {
    if (widget.challenge.previewParticipants == null) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: _showParticipantsBottomSheet,
        child: ChallengeParticipantsPreview(
          preview: widget.challenge.previewParticipants!,
        ),
      ),
    );
  }

  Widget _actionButtons() => _ActionButtons(
        challenge: widget.challenge,
        onJoinChallengePressed: widget.onJoinChallengePressed,
        onPostPressed: widget.onCreatePostPressed,
        onChatPressed: widget.onChatPressed,
        onSharePressed: widget.onSharePressed,
        onMorePressed: widget.onMorePressed,
        isGeneratingInviteCode: widget.isGeneratingInviteCode,
      );

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _challengeName(),
          const SizedBox(height: 4),
          _authorHandle(),
          _participantsPreview(),
          _actionButtons(),
          ..._description(),
        ],
      );
}

class _ActionButtons extends StatefulWidget {
  final Challenge challenge;
  final VoidCallback onJoinChallengePressed;
  final VoidCallback onPostPressed;
  final VoidCallback onChatPressed;
  final VoidCallback onSharePressed;
  final VoidCallback onMorePressed;
  final bool isGeneratingInviteCode;

  const _ActionButtons({
    required this.challenge,
    required this.onJoinChallengePressed,
    required this.onPostPressed,
    required this.onChatPressed,
    required this.onSharePressed,
    required this.onMorePressed,
    this.isGeneratingInviteCode = false,
  });

  @override
  State<_ActionButtons> createState() => _ActionButtonsState();
}

class _ActionButtonsState extends State<_ActionButtons> {
  bool get _hasJoined => widget.challenge.hasJoined;
  bool get _hasNotStarted => widget.challenge.hasNotStarted;
  bool get _challengeEnded => widget.challenge.isCompleted ?? false;

  Widget _challengeEndedButton() => ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 14.5),
        ),
        onPressed: null,
        child: Text(AppLocalizations.of(context)!.challenge_ended),
      );

  Widget _createPostButton({bool isButtonEnabled = true}) => ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.symmetric(horizontal: _hasJoined ? 27 : 40.5),
          backgroundColor:
              isButtonEnabled ? WildrColors.primaryColor : WildrColors.gray100,
        ),
        onPressed: widget.onPostPressed,
        child: Row(
          children: [
            WildrIcon(
              WildrIcons.plus_circle_outline,
              size: 20,
              color: isButtonEnabled ? WildrColors.white : WildrColors.gray600,
            ),
            const SizedBox(width: 5),
            Text(
              AppLocalizations.of(context)!.challenge_cap_post,
              style: TextStyle(
                color:
                    isButtonEnabled ? WildrColors.white : WildrColors.gray600,
              ),
            ),
          ],
        ),
      );

  Widget _joinChallengeButton() => ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.symmetric(horizontal: _hasJoined ? 27 : 40.5),
        ),
        onPressed: widget.onJoinChallengePressed,
        child: Text(AppLocalizations.of(context)!.challenge_cap_join),
      );

  Widget _communityDiscussionButton() {
    final foregroundColor = ChallengesStyles.of(context).primaryTextColor;
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        backgroundColor: backgroundColor,
        foregroundColor: foregroundColor,
      ),
      onPressed: widget.onChatPressed,
      child: Row(
        children: [
          const WildrIcon(WildrIcons.discuss, size: 20),
          const SizedBox(width: 7),
          Text(AppLocalizations.of(context)!.challenge_cap_discuss),
        ],
      ),
    );
  }

  Widget _share() => ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.zero,
          backgroundColor: backgroundColor,
        ),
        onPressed: widget.onSharePressed,
        child: widget.isGeneratingInviteCode
            ? const CupertinoActivityIndicator()
            : const WildrIcon(
                WildrIcons.share,
                size: 20,
              ),
      );

  Widget _more() => ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.zero,
          backgroundColor: backgroundColor,
        ),
        onPressed: widget.onMorePressed,
        child: const WildrIcon(
          WildrIcons.more,
          size: 20,
        ),
      );

  Color? backgroundColor;

  Widget _primaryCTA() {
    if (_challengeEnded) {
      return _challengeEndedButton();
    } else if (_hasJoined) {
      return _createPostButton(isButtonEnabled: !_hasNotStarted);
    } else {
      return _joinChallengeButton();
    }
  }

  @override
  Widget build(BuildContext context) {
    backgroundColor = Theme.of(context).brightness == Brightness.dark
        ? WildrColors.gray1000
        : WildrColors.gray100;
    return Row(
      children: [
        _primaryCTA(),
        const SizedBox(width: 8),
        _communityDiscussionButton(),
        const SizedBox(width: 8),
        _share(),
        const SizedBox(width: 8),
        _more(),
      ],
    );
  }
}

class _ExpandableDescription extends StatefulWidget {
  final ChallengeDescription description;

  const _ExpandableDescription({
    required this.description,
  });

  @override
  State<_ExpandableDescription> createState() => _ExpandableDescriptionState();
}

class _ExpandableDescriptionState extends State<_ExpandableDescription> {
  bool _isContracted = true;

  Widget _fromSegments() {
    // return Text('r\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\nr\n');
    final segments = widget.description.segments ?? [];
    return ExpandableTextFromSegments(
      segments,
      trimLines: 1,
      contracted: _isContracted,
      onStateToggled: (isContracted) {
        setState(() {
          _isContracted = isContracted;
        });
      },
      readMoreButtonText: AppLocalizations.of(context)!.challenge_dottedMore,
      tagsOrMentionsColor: WildrColors.primaryColor,
      contentStyle: ChallengesStyles.of(context).subtitle2TextStyle,
      // contentStyle: TextStyle(
      //   fontSize: 14.0.sp,
      //   color: WildrColors.textColor(),
      //   fontWeight: FontWeight.w500,
      // ),
      clickableTextStyle: Common().captionTextStyle(),
    );
  }

  List<InlineSpan> _seeMoreTextSpan(TextStyle? textStyle) => [
        TextSpan(
          text: ' ...more',
          style: textStyle?.copyWith(
            color: WildrColors.white,
          ),
          recognizer: TapGestureRecognizer()
            ..onTap = () {
              setState(() {
                _isContracted = !_isContracted;
              });
            },
        ),
      ];

  Widget _fromBodyStr() {
    final textStyle = ChallengesStyles.of(context).subtitle2TextStyle;
    final body = widget.description.body ?? '';
    final String bodyStr;
    if (_isContracted) {
      bodyStr = body.substring(0, min(body.length, 100));
    } else {
      bodyStr = body;
    }
    return Text.rich(
      TextSpan(
        text: bodyStr,
        style: textStyle,
        children: _isContracted && body.length > 100
            ? _seeMoreTextSpan(textStyle)
            : [],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.description.segments != null) return _fromSegments();
    return _fromBodyStr();
  }
}
