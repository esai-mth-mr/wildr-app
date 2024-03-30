import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';

@Deprecated('use [commentVisibilityAccessControlContext]')
class PostAccessControlContext {
  PostVisibilityAccess? postVisibility;
  CommentVisibilityAccess? commentVisibilityAccess;
  CommentPostingAccess? commentPostingAccess;
  bool? canComment;
  String? cannotCommentErrorMessage;
  bool? canViewComment;
  String? cannotViewCommentErrorMessage;

  PostAccessControlContext({
    required this.postVisibility,
    required this.commentVisibilityAccess,
    required this.commentPostingAccess,
    required this.canComment,
    required this.cannotCommentErrorMessage,
    required this.canViewComment,
    required this.cannotViewCommentErrorMessage,
  });

  PostAccessControlContext.fromJson(Map<String, dynamic> json) {
    canComment = json['canComment'];
    canViewComment = json['canViewComment'];
    cannotCommentErrorMessage = json['cannotCommentErrorMessage'];
    cannotViewCommentErrorMessage = json['cannotViewCommentErrorMessage'];
    postVisibility = fromGqlPostVisibilityAccess(json['postVisibility'] ?? '');
    commentVisibilityAccess =
        fromGqlCommentVisibilityAccess(json['commentVisibilityAccess'] ?? '');
    commentPostingAccess =
        fromGqlCommentPostingAccess(json['commentPostingAccess'] ?? '');
  }

  @override
  String toString() => '''
    postVisibility: $postVisibility,
    commentVisibilityAccess: $commentVisibilityAccess,
    commentPostingAccess: $commentPostingAccess,
    canComment: $canComment,
    cannotCommentErrorMessage: $cannotCommentErrorMessage,
    canViewComment: $canViewComment,
    cannotViewCommentErrorMessage: $cannotViewCommentErrorMessage,
    ''';
}
