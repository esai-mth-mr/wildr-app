import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_keyboard_size/flutter_keyboard_size.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_event.dart';
import 'package:wildr_flutter/feat_challenges/create_challenge_post_entry/widget/assign_to_challenge_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/bottom_sheets/comment_posting_radio_buttons.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/bottom_sheets/comment_visibility_radio_buttons.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/bottom_sheets/post_settings_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/bottom_sheets/post_visibility_radio_buttons.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_settings.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/widgets/post_settings_list_tile.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostSettingsList extends StatefulWidget {
  final PostSettingsGxC? postSettingsGxC;
  final bool shouldSavePrefs;
  final bool isStory;
  final Function? onPrefsUpdate;
  final bool shouldShowRepostOptions;
  final bool shouldShowJoinedChallenges;
  final bool isFromRepost;

  const PostSettingsList({
    super.key,
    this.postSettingsGxC,
    this.isStory = false,
    this.shouldSavePrefs = false,
    this.shouldShowRepostOptions = false,
    this.onPrefsUpdate,
    this.shouldShowJoinedChallenges = false,
    this.isFromRepost = false,
  });

  @override
  State<PostSettingsList> createState() => _PostSettingsListState();
}

class _PostSettingsListState extends State<PostSettingsList> {
  PostSettingsGxC get _postSettingsGxC =>
      widget.postSettingsGxC ??
      Get.put(
        PostSettingsGxC(),
        tag: 'default',
      );
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  bool get _isReposting => _postSettingsGxC.canRepost;

  bool get _isRepostEnabled =>
      _postSettingsGxC.selectedPostVisibilityAccess ==
      PostVisibilityAccess.EVERYONE;

  @override
  void initState() {
    super.initState();
  }

  bool _shouldDisable(int length) {
    if (widget.isStory) {
      return true;
    } else if (length == 0) {
      return true;
    } else {
      return false;
    }
  }

  void _showBottomSheet(String title, String subTitle, Widget body) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10.0),
      ),
      builder: (context) => PostSettingsBottomSheet(
        title: title,
        subTitle: subTitle,
        body: body,
      ),
    );
  }

  void _saveToPrefs() {
    if (widget.shouldSavePrefs) {
      debugPrint('Saving to prefs');
      PostSettings(
        postVisibilityAccess:
            _postSettingsGxC.selectedPostVisibilityAccess.name,
        commentVisibilityAccess:
            _postSettingsGxC.selectedCommentVisibilityAccess.name,
        commentPostingAccess:
            _postSettingsGxC.selectedCommentPostingAccess.name,
      ).saveToSharedPreference();
      if (widget.onPrefsUpdate != null) {
        widget.onPrefsUpdate!.call();
      }
    }
  }

  Widget _postVisibility() {
    print(
      '_postSettingsGxC.selectedChallenge.value.id.isNotEmpty'
      ' ${_postSettingsGxC.selectedChallenge.value.id.isNotEmpty}',
    );
    print(
      '_postSettingsGxC.selectedPostVisibilityAccess'
      ' ${_postSettingsGxC.selectedPostVisibilityAccess.name}',
    );
    final bool shouldDisable =
        _postSettingsGxC.selectedChallenge.value.id.isNotEmpty;
    return AbsorbPointer(
      absorbing: shouldDisable,
      child: Opacity(
        opacity: shouldDisable ? 0.2 : 1,
        child: PostSettingsListTile(
          text: _appLocalizations.createPost_whoCanSeeThisPost,
          decisionValue:
              _postSettingsGxC.selectedPostVisibilityAccess.toViewString(),
          onPressed: () {
            _showBottomSheet(
              _appLocalizations.createPost_whoCanSeeThisPost,
              _appLocalizations.createPost_whoCanSeeThisPostDescription,
              PostVisibilityRadioButtons(
                _postSettingsGxC.postVisibilityAccessOptions,
                postSettingsGxC: _postSettingsGxC,
                onChanged: (value) {
                  _postSettingsGxC.selectedPostVisibilityAccess = value;
                  _saveToPrefs();
                  setState(() {});
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _commentVisibility() {
    final bool shouldDisable =
        _shouldDisable(_postSettingsGxC.commentVisibilityAccessOptions.length);
    return AbsorbPointer(
      absorbing: shouldDisable,
      child: Opacity(
        opacity: shouldDisable ? 0.2 : 1,
        child: PostSettingsListTile(
          text: _appLocalizations.createPost_whoCanSeeTheComment,
          decisionValue: shouldDisable
              ? _appLocalizations.createPost_noOne
              : _postSettingsGxC.selectedCommentVisibilityAccess.toViewString(),
          onPressed: () {
            if (shouldDisable) return;
            _showBottomSheet(
              _appLocalizations.createPost_whoCanSeeTheComment,
              _appLocalizations.createPost_whoCanSeeTheCommentDescription,
              CommentVisibilityRadioButtons(
                _postSettingsGxC.commentVisibilityAccessOptions,
                postSettingsGxC: _postSettingsGxC,
                onChanged: (value) {
                  _postSettingsGxC.selectedCommentVisibilityAccess = value;
                  _saveToPrefs();
                  setState(() {});
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _commentPosting() {
    final bool shouldDisable =
        _shouldDisable(_postSettingsGxC.commentPostingAccessOptions.length);
    return AbsorbPointer(
      absorbing: shouldDisable,
      child: Opacity(
        opacity: shouldDisable ? 0.2 : 1,
        child: PostSettingsListTile(
          text: _appLocalizations.createPost_whoCanCommentOnThisPost,
          decisionValue: shouldDisable
              ? _appLocalizations.createPost_noOne
              : _postSettingsGxC.selectedCommentPostingAccess.toViewString(),
          onPressed: () {
            if (shouldDisable) return;
            _showBottomSheet(
              _appLocalizations.createPost_whoCanCommentOnThisPost,
              _appLocalizations.createPost_whoCanCommentOnThisPostDescription,
              CommentPostingRadioButtons(
                _postSettingsGxC.commentPostingAccessOptions,
                postSettingsGxC: _postSettingsGxC,
                onChanged: (value) {
                  _postSettingsGxC.selectedCommentPostingAccess = value;
                  _saveToPrefs();
                  setState(() {});
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _repostAccess() {
    final child = ListTile(
      shape: const Border(),
      tileColor: Colors.transparent,
      contentPadding: const EdgeInsets.only(right: 8, top: 10),
      dense: true,
      minLeadingWidth: 1,
      title: Text(
        _appLocalizations.createPost_allowReposts,
        style: TextStyle(
          fontSize: 14.0.sp,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: Transform.scale(
        scale: 0.95,
        child: CupertinoSwitch(
          activeColor:
              widget.isStory ? Colors.orange : WildrColors.primaryColor,
          value: _isReposting,
          onChanged: (status) {
            setState(() {
              _postSettingsGxC.canRepost = status;
            });
          },
        ),
      ),
    );
    if (_isRepostEnabled) {
      return child;
    }
    return AbsorbPointer(
      child: Opacity(opacity: 0.5, child: child),
    );
  }

  Widget _assignToChallenge() {
    final bool shouldDisable = widget.isStory || widget.isFromRepost;
    return AbsorbPointer(
      absorbing: shouldDisable,
      child: Opacity(
        opacity: shouldDisable ? 0.2 : 1,
        child: PostSettingsListTile(
          text: _appLocalizations.createPost_assignToChallenge,
          decisionValue:
              shouldDisable ? '-' : _postSettingsGxC.joinedChallengeName,
          onPressed: () async {
            if (shouldDisable) return;
            context
                .read<MainBloc>()
                .add(GetJoinedChallengesEvent(challengeState: 'ACTIVE'));
            return await showModalBottomSheet(
              barrierColor: WildrColors.black.withOpacity(0.6),
              isScrollControlled: true,
              context: context,
              backgroundColor: Colors.transparent,
              builder: (context) =>
                  AssignToChallengeBottomSheet(_postSettingsGxC),
            ).then((value) {
              _saveToPrefs();
              setState(() {});
            });
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Column(
        children: [
          if (widget.shouldShowRepostOptions) _repostAccess(),
          _postVisibility(),
          _commentPosting(),
          _commentVisibility(),
          if (widget.shouldShowJoinedChallenges) _assignToChallenge(),
        ],
      );

  @override
  void dispose() {
    super.dispose();
  }
}
