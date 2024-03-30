import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/home/model/comment.dart';

class CommentGxC extends GetxController {
  var isSendingComment = false.obs;
  var list = RxList<Comment>().obs;
  var isAuthorOfThePost = false;
  Widget? replyingToCommentBodyWidget;
  String selectedCommentId = '';

  List<Comment> get commentsList => list.value;

  // Comment get replyingToComment {
  //   if (list.value.isEmpty) {
  //     return Comment.empty();
  //   } else if (replyingToCommentIndex == -1) {
  //     return Comment.empty();
  //   } else {
  //     return list.value[replyingToCommentIndex];
  //   }
  // }
  //
  // final _replyingToCommentIndex = 0.obs;
  //
  // int get replyingToCommentIndex => _replyingToCommentIndex.value;
  //
  // set replyingToCommentIndex(int value) {
  //   _replyingToCommentIndex.value = value;
  // }

  Comment? replyingToComment;

  final _pinnedComment = Comment.empty().obs;

  set pinnedComment(Comment? comment) {
    if (comment == null) {
      _pinnedComment.value = Comment.empty();
    } else {
      _pinnedComment.value = comment;
    }
  }

  Comment get pinnedComment => _pinnedComment.value;

  var currentTab = 0.obs;

  void clearAll() {
    isSendingComment.value = false;
    pinnedComment = null;
    list.value.clear();
    //replyingToCommentIndex = -1;
  }
}
