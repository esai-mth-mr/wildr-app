// ignore_for_file: avoid_positional_boolean_parameters

import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class ExploreFeedUpdateState extends MainState {
  final List<Post> posts;
  final String endCursor;
  final String errorMessage;
  final bool isSuccessful;
  final bool isLoading;

  ExploreFeedUpdateState({
    this.endCursor = '',
    this.errorMessage = '',
    this.posts = const [],
    this.isLoading = false,
  }) : isSuccessful = errorMessage.isEmpty;
}

class CanPaginateExploreFeedState extends MainState {
  final bool canPaginate;

  CanPaginateExploreFeedState(this.canPaginate) : super();
}

class ExploreFeedVariablesUpdatedState extends MainState {}
