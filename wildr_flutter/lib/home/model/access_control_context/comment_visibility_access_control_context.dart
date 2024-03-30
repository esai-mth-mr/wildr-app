import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';

class CommentVisibilityACC {
  late CommentVisibilityAccess commentVisibilityAccess;
  late bool canViewComment;
  late String? cannotViewCommentErrorMessage;

  CommentVisibilityACC.fromJson(Map<String, dynamic> map) {
    commentVisibilityAccess =
        fromGqlCommentVisibilityAccess(map['commentVisibilityAccess']);
    canViewComment = map['canViewComment'] ?? false;
    cannotViewCommentErrorMessage = map['cannotViewCommentErrorMessage'];
  }
}
