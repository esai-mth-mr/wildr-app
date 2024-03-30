import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_notifications/model/user_activity.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class CurrentUserProfileRefreshState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;
  final WildrUser? user;

  CurrentUserProfileRefreshState({
    required this.isSuccessful,
    this.errorMessage,
    this.user,
  }) : super();

  CurrentUserProfileRefreshState.fromEvent(CurrentUserStatusUpdateEvent event)
      : isSuccessful = event.isSuccessful,
        errorMessage = event.errorMessage,
        user = event.user,
        super();
}

class CurrentUserPaginatedPostsState extends MainState {
  final bool hasError;
  final String? errorMessage;
  final List<Post> posts;
  final String endCursor;
  final bool hasReachedEndOfTheList;

  CurrentUserPaginatedPostsState({
    this.errorMessage,
    this.posts = const [],
    this.endCursor = '',
    this.hasReachedEndOfTheList = false,
  })  : hasError = errorMessage != null,
        super();
}

class PaginatedUserActivityState extends MainState {
  final String? errorMessage;
  final List<UserActivity>? activityList;
  final String? startCursor;
  final String? endCursor;

  PaginatedUserActivityState({
    this.errorMessage,
    this.activityList,
    this.startCursor,
    this.endCursor,
  });
}

class RefreshCurrentUserPageState extends MainState {}

class GoToUserListState extends MainState {
  final UserListType userListType;

  GoToUserListState(this.userListType);
}
