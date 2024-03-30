import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';

class CommentPostingACC {
  late CommentPostingAccess commentPostingAccess;
  late bool canComment;
  late String cannotCommentErrorMessage;

  CommentPostingACC.fromJson(Map<String, dynamic> map) {
    commentPostingAccess =
        fromGqlCommentPostingAccess(map['commentPostingAccess']);
    canComment = map['canComment'] ?? false;
    cannotCommentErrorMessage =
        map['cannotCommentErrorMessage'] ?? kSomethingWentWrong;
  }
}
