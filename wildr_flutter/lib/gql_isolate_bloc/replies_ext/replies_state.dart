import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/home/model/reply.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class DeleteReplyState extends MainState {
  final String parentCommentId;
  final bool isSuccessful;
  final int index;
  final String? errorMessage;
  final String replyId;

  DeleteReplyState(
    this.parentCommentId, {
    this.isSuccessful = true,
    required this.index,
    this.errorMessage,
    required this.replyId,
  });
}

class ReplyTrollingDetectedState extends MainState {
  final TrollDetectedData data;

  ReplyTrollingDetectedState(this.data);
}

class PaginateRepliesState extends MainState {
  final String parentCommentId;
  final List<Reply> replies;
  final bool isRefreshing;
  final String? errorMessage;
  final bool isLoadingAbove;
  final bool hasPreviousPage;
  final bool hasNextPage;
  final String? targetReplyError;

  PaginateRepliesState({
    required this.parentCommentId,
    this.replies = const [],
    this.isRefreshing = true,
    this.errorMessage,
    this.isLoadingAbove = false,
    this.hasPreviousPage = false,
    this.hasNextPage = false,
    this.targetReplyError,
  });
}

class AddReplyState extends MainState {
  final Reply? reply;
  final String? errorMessage;
  final String parentCommentId;

  AddReplyState(
    this.parentCommentId, {
    this.errorMessage,
    this.reply,
  });
}

class ReactOnReplyState extends MainState {
  final String replyId;
  final bool liked;
  final String? errorMessage;

  ReactOnReplyState(
    this.replyId, {
    required this.liked,
    this.errorMessage,
  });
}

class PaginateReplyLikesState extends MainState {
  final String? errorMessage;
  final List<WildrUser> users;

  PaginateReplyLikesState({required this.users, this.errorMessage});
}
