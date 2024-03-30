import 'dart:convert';

import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class ChallengePostDraft {
  String? challengeId;
  String? caption;
  String? postVisibilityAccess;
  String? commentPostingAccess;
  String? assignToChallenge;
  String? postUrl;

  ChallengePostDraft({
    required this.challengeId,
    required this.caption,
    required this.postVisibilityAccess,
    required this.commentPostingAccess,
    required this.assignToChallenge,
    required this.postUrl,
  });

  ChallengePostDraft.fromJson(Map<String, dynamic> json) {
    challengeId = json['challengeId'];
    caption = json['caption'];
    postVisibilityAccess = json['postVisibilityAccess'];
    commentPostingAccess = json['commentPostingAccess'];
    assignToChallenge = json['assignToChallenge'];
    postUrl = json['postUrl'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['challengeId'] = challengeId;
    data['caption'] = caption;
    data['assignToChallenge'] = assignToChallenge;
    data['postUrl'] = postUrl;
    data['postVisibilityAccess'] =
        postVisibilityAccess ?? PostVisibilityAccess.EVERYONE;
    data['commentPostingAccess'] =
        commentPostingAccess ?? CommentPostingAccess.EVERYONE;
    return data;
  }

  @override
  String toString() =>
      'ChallengePostDraft{challengeId: $challengeId, caption: $caption, '
      'postVisibilityAccess: $postVisibilityAccess, '
      'commentPostingAccess: $commentPostingAccess,'
      ' assignToChallenge: $assignToChallenge, postUrl: $postUrl}';

  void saveToSharedPreference() {
    final json = jsonEncode(this);
    Prefs.setString(
      PrefKeys.kChallengePostDraft,
      json,
    );
  }
}
