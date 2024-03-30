// ignore_for_file: avoid_positional_boolean_parameters

import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_type.dart';

///Feed
class HomeFeedUpdateState extends MainState {
  final List<Post> posts;
  final String endCursor;
  final String errorMessage;
  final bool isSuccessful;
  final bool isLoading;

  HomeFeedUpdateState({
    this.endCursor = '',
    this.errorMessage = '',
    this.posts = const [],
    this.isSuccessful = true,
    this.isLoading = false,
  });
}

class HomeFeedVariablesUpdatedState extends MainState {}

class UpdateSensitiveContentState extends MainState {
  final PostOverlayType feedOverlay;

  UpdateSensitiveContentState(this.feedOverlay);
}

class CanPaginateHomeFeedState extends MainState {
  final bool canPaginate;

  CanPaginateHomeFeedState(this.canPaginate) : super();
}
