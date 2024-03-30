import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/repost_access.dart';

class PostAccessControlData {
  PostVisibilityAccess? postVisibility;
  CommentVisibilityAccess? commentVisibilityAccess;
  CommentPostingAccess? commentPostingAccess;
  RepostAccess? repostAccess;

  PostAccessControlData({
    required this.postVisibility,
    required this.commentVisibilityAccess,
    required this.commentPostingAccess,
  });

  PostAccessControlData.fromJson(Map<String, dynamic> json) {
    postVisibility = fromGqlPostVisibilityAccess(json['postVisibility'] ?? '');
    commentVisibilityAccess =
        fromGqlCommentVisibilityAccess(json['commentVisibilityAccess'] ?? '');
    commentPostingAccess =
        fromGqlCommentPostingAccess(json['commentPostingAccess'] ?? '');
    repostAccess = fromGqlRepostAccess(json['repostAccess'] ?? '');
  }

  @override
  String toString() => '''
    postVisibility: $postVisibility,
    commentVisibilityAccess: $commentVisibilityAccess,
    commentPostingAccess: $commentPostingAccess,
    repostAccess: $repostAccess,
    ''';
}
