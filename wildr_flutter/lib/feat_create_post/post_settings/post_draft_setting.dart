import 'package:get/get.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/gxc/draft_manager_gxc.dart';

enum PostDraftType {
  CHALLENGE,
  DEFAULT,
}

class PostSettingsDraft {
  String? postVisibilityAccess;
  String? commentVisibilityAccess;
  String? commentPostingAccess;
  String? postsData;
  String? challengeId;
  PostDraftType? draftType;
  final DraftManagerGxC draftGxC = Get.find();

  PostSettingsDraft({
    required this.postVisibilityAccess,
    required this.commentVisibilityAccess,
    required this.commentPostingAccess,
    required this.postsData,
    required this.draftType,
    this.challengeId,
  });

  PostSettingsDraft.fromJson(Map<String, dynamic> json) {
    postVisibilityAccess = json['postVisibilityAccess'];
    commentVisibilityAccess = json['commentVisibilityAccess'];
    commentPostingAccess = json['commentPostingAccess'];
    postsData = json['postsData'];
    challengeId = json['challengeId'];
    draftType = draftTypeFromString(json['draftType'] ?? '');
  }

  PostDraftType? draftTypeFromString(String value) {
    switch (value) {
      case 'CHALLENGE':
        return PostDraftType.CHALLENGE;
      case 'DEFAULT':
        return PostDraftType.DEFAULT;
    }
    return null;
  }

  @override
  bool operator ==(other) =>
      other is PostSettingsDraft &&
      postVisibilityAccess == other.postVisibilityAccess &&
      commentVisibilityAccess == other.commentVisibilityAccess &&
      commentPostingAccess == other.commentPostingAccess &&
      postsData == other.postsData &&
      challengeId == other.challengeId &&
      draftType == other.draftType;

  @override
  int get hashCode => Object.hash(
        postVisibilityAccess,
        commentVisibilityAccess,
        commentPostingAccess,
        postsData,
        challengeId,
        draftType,
      );

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['postVisibilityAccess'] =
        postVisibilityAccess ?? PostVisibilityAccess.EVERYONE;
    data['commentVisibilityAccess'] =
        commentVisibilityAccess ?? CommentVisibilityAccess.EVERYONE;
    data['commentPostingAccess'] =
        commentPostingAccess ?? CommentPostingAccess.EVERYONE;
    data['postsData'] = postsData ?? '';
    data['challengeId'] = challengeId ?? '';
    data['draftType'] = draftType.toString();
    return data;
  }

  @override
  String toString() =>
      'PostSettings{postVisibilityAccess: $postVisibilityAccess,'
      ' commentVisibilityAccess: $commentVisibilityAccess,'
      ' commentPostingAccess: $commentPostingAccess,'
      ' postsData: $postsData, challengeId:'
      ' $challengeId, draftType: $draftType}';

  void saveToSharedPreference() {
    draftGxC.saveDraft(this);
  }
}
