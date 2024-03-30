import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_events.dart';
import 'package:wildr_flutter/home/model/access_control_context/comment_posting_access_control_context.dart';
import 'package:wildr_flutter/home/model/access_control_context/comment_visibility_access_control_context.dart';
import 'package:wildr_flutter/home/model/comment.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class FlagCommentState extends MainState {
  final FlagCommentOperation operation;
  final String? errorMessage;
  final String commentId;
  final int index;

  FlagCommentState({
    required this.operation,
    required this.index,
    required this.errorMessage,
    required this.commentId,
  });
}

class BlockCommenterOnPostState extends MainState {
  final CommenterBlockOperation operation;
  final String? errorMessage;
  final String handle;

  BlockCommenterOnPostState({
    required this.operation,
    required this.errorMessage,
    required this.handle,
  });
}

class DeleteCommentState extends MainState {
  final String parentPostId;
  final bool isSuccessful;
  final int index;
  final String? errorMessage;
  final String commentId;

  DeleteCommentState(
    this.parentPostId, {
    this.isSuccessful = true,
    required this.index,
    this.errorMessage,
    required this.commentId,
  });
}

class PaginateCommentsState extends MainState {
  final String parentId;
  final List<Comment> comments;
  final bool isRefreshing;
  final String? errorMessage;
  final bool isLoadingAbove;
  final bool shouldShowLoadAboveButton;
  final String? targetCommentError;
  final CommentPostingACC? commentPostingACC;
  final CommentVisibilityACC? commentVisibilityACC;

  PaginateCommentsState({
    required this.parentId,
    this.comments = const [],
    this.isRefreshing = true,
    this.errorMessage,
    this.commentPostingACC,
    this.isLoadingAbove = false,
    this.shouldShowLoadAboveButton = false,
    this.targetCommentError,
    this.commentVisibilityACC,
  });
}

class AddCommentsState extends MainState {
  final Comment? comment;
  final String? errorMessage;
  final String parentPostId;
  final bool postNotFound;

  AddCommentsState(
    this.parentPostId, {
    this.errorMessage,
    this.comment,
    this.postNotFound = false,
  });
}

class ReactOnCommentState extends MainState {
  final String commentId;
  final bool liked;
  final String? errorMessage;

  ReactOnCommentState(
    this.commentId, {
    required this.liked,
    this.errorMessage,
  });
}

class PinACommentResult extends MainState {
  final String parentPostId;
  final bool isSuccessful;
  final int? index;
  final String? errorMessage;
  final Comment? commentToUnpin; //to be pinned back

  PinACommentResult(
    this.parentPostId,
    this.errorMessage,
    this.index,
    this.commentToUnpin,
  ) : isSuccessful = errorMessage == null;
}

class UpdateCommentParticipationTypeResult extends MainState {
  final bool isSuccessful;
  final int? index;
  final String? errorMessage;
  final Comment? previousCommentState; //to be pinned back

  UpdateCommentParticipationTypeResult({
    this.isSuccessful = true,
    this.errorMessage,
    this.index,
    this.previousCommentState,
  });
}

class CommentTrollingDetectedState extends MainState {
  final TrollDetectedData data;

  CommentTrollingDetectedState(this.data);
}

class PaginateCommentLikesState extends MainState {
  final String? errorMessage;
  final List<WildrUser> users;

  PaginateCommentLikesState({required this.users, this.errorMessage});
}
