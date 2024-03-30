import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_settings.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/repost_access.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class PostSettingsGxC extends GetxController {
  late PostVisibilityAccess _selectedPostVisibilityAccess;
  late CommentPostingAccess _selectedCommentPostingAccess;
  late CommentVisibilityAccess selectedCommentVisibilityAccess;
  late RepostAccess repostAccess;
  List<PostVisibilityAccess> postVisibilityAccessOptions = [
    PostVisibilityAccess.EVERYONE,
    PostVisibilityAccess.INNER_CIRCLE,
    PostVisibilityAccess.FOLLOWERS,
  ];
  List<CommentVisibilityAccess> commentVisibilityAccessOptions = [];
  List<CommentPostingAccess> commentPostingAccessOptions = [];
  bool _hasBeenInit = false;

  List<Challenge> joinedChallenges = [];

  // Challenge? selectedChallenge;
  Rx<Challenge> selectedChallenge = Challenge.empty().obs;

  String get joinedChallengeName {
    if (selectedChallenge.value.id.isEmpty) return 'None';
    final Challenge? challenge = joinedChallenges.firstWhereIndexedOrNull(
      (index, challenge) => challenge.id == selectedChallenge.value.id,
    );
    return challenge?.name ?? 'None';
  }

  PostVisibilityAccess get selectedPostVisibilityAccess =>
      _selectedPostVisibilityAccess;

  set selectedPostVisibilityAccess(PostVisibilityAccess value) {
    _selectedPostVisibilityAccess = value;
    if (_hasBeenInit) onPostVisibilityAccessChanged();
  }

  set canRepost(bool value) {
    repostAccess = value ? RepostAccess.EVERYONE : RepostAccess.NONE;
  }

  bool get canRepost => repostAccess == RepostAccess.EVERYONE;

  CommentPostingAccess get selectedCommentPostingAccess =>
      _selectedCommentPostingAccess;

  set selectedCommentPostingAccess(CommentPostingAccess value) {
    _selectedCommentPostingAccess = value;
    if (_hasBeenInit) onWhoCanCommentChanged();
  }

  PostSettingsGxC() {
    initFromPrefs();
  }

  void initFromPrefs() {
    final String? postSettingsFromPrefs =
        Prefs.getString(PrefKeys.kPostSettings);
    if (postSettingsFromPrefs == null) {
      selectedPostVisibilityAccess = PostVisibilityAccess.EVERYONE;
      selectedCommentVisibilityAccess = CommentVisibilityAccess.EVERYONE;
      selectedCommentPostingAccess = CommentPostingAccess.EVERYONE;
    } else {
      final PostSettings postSettings =
          PostSettings.fromJson(jsonDecode(postSettingsFromPrefs));
      selectedPostVisibilityAccess = fromGqlPostVisibilityAccess(
        postSettings.postVisibilityAccess ?? 'EVERYONE',
      );
      selectedCommentPostingAccess = fromGqlCommentPostingAccess(
        postSettings.commentPostingAccess ?? 'EVERYONE',
      );
      selectedCommentVisibilityAccess = fromGqlCommentVisibilityAccess(
        postSettings.commentVisibilityAccess ?? 'EVERYONE',
      );
    }
    if (!_hasBeenInit) {
      onPostVisibilityAccessChanged();
      onWhoCanCommentChanged();
    }
    _hasBeenInit = true;
  }

  void onPostVisibilityAccessChanged() {
    commentPostingAccessOptions = [
      fromGqlCommentPostingAccess(selectedPostVisibilityAccess.name),
      CommentPostingAccess.NONE,
    ];
    selectedCommentPostingAccess =
        fromGqlCommentPostingAccess(selectedPostVisibilityAccess.name);
    repostAccess = _selectedPostVisibilityAccess.repostAccess();
  }

  void onWhoCanCommentChanged() {
    if (selectedCommentPostingAccess == CommentPostingAccess.NONE) {
      commentVisibilityAccessOptions = [];
    } else {
      commentVisibilityAccessOptions = [
        fromGqlCommentVisibilityAccess(selectedPostVisibilityAccess.name),
        CommentVisibilityAccess.AUTHOR,
      ];
    }
    selectedCommentVisibilityAccess =
        fromGqlCommentVisibilityAccess(selectedCommentPostingAccess.name);
  }
}
