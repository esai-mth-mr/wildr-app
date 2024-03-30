import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/feat_challenges/models/troll_detection_result_model.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class RepostCreatedFailedState extends MainState {
  final String? message;

  RepostCreatedFailedState({this.message});
}

class RepostCreatedState extends MainState {
  final bool isStory;

  RepostCreatedState({this.isStory = false}) : super();
}

class RepostTrollingDetectedState extends MainState {
  final PostTrollDetectedData data;

  RepostTrollingDetectedState(this.data);
}

class GetPostPinnedCommentState extends MainState {
  final String? errorMessage;
  final String postId;
  final Post? post;

  GetPostPinnedCommentState({
    required this.postId,
    this.errorMessage,
    this.post,
  });
}

class PaginateRepostedPostsState extends MainState {
  final String? errorMessage;
  final bool isSuccessful;
  final List<Post>? posts;

  PaginateRepostedPostsState({this.errorMessage, this.posts})
      : isSuccessful = errorMessage == null;
}

class TextPostTrollDetectionState extends MainState {
  final String? errorMessage;
  final TrollDetectionModel? trollResult;

  TextPostTrollDetectionState({
    this.trollResult,
    this.errorMessage,
  });
}
