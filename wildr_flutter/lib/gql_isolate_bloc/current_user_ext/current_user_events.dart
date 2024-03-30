import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class RefreshCurrentUserDetailsEvent extends MainBlocEvent {
  final String idOfUserToFetch;

  RefreshCurrentUserDetailsEvent(this.idOfUserToFetch) : super();
}

class CurrentUserUpdatedEvent extends MainBlocEvent {}

class GetCurrentUserPostsEvent extends MainBlocEvent {
  final String? idOfUser;
  final String endCursor;

  GetCurrentUserPostsEvent(this.idOfUser, this.endCursor) : super();
}

class CurrentUserStatusUpdateEvent extends MainBlocEvent {
  final bool isSuccessful;
  final String? errorMessage;
  final WildrUser? user;

  CurrentUserStatusUpdateEvent({
    required this.isSuccessful,
    this.errorMessage,
    this.user,
  }) : super();
}

class CurrentUserPostsPaginationEvent extends MainBlocEvent {
  final bool hasError;
  final String? errorMessage;
  final List<Post> posts;
  final String endCursor;
  final bool hasReachedEndOfTheList;

  CurrentUserPostsPaginationEvent({
    required this.posts,
    required this.endCursor,
    this.hasError = false,
    this.errorMessage,
    this.hasReachedEndOfTheList = false,
  }) : super();

  CurrentUserPostsPaginationEvent.hasError(
    this.errorMessage,
  )   : posts = [],
        endCursor = '',
        hasError = true,
        hasReachedEndOfTheList = false,
        super();
}

class PaginateCurrentUserActivityEvent extends MainBlocEvent {
  final String? userId;
  final int? first;
  final int? last;
  final String? after;
  final String? before;

  PaginateCurrentUserActivityEvent(
    this.userId, {
    this.first = DEFAULT_FIRST_COUNT,
    this.last,
    this.after,
    this.before,
  });

  PaginateCurrentUserActivityEvent.loadMore(this.userId, this.after)
      : first = DEFAULT_FIRST_COUNT,
        before = null,
        last = null;

  Map<String, dynamic> getVariables({String? id}) => {
      'getUserInput': {
        'id': id ?? userId,
      },
      'first': first,
      'last': last,
      'after': after,
      'before': before,
    };
}

class RefreshCurrentUserPageEvent extends MainBlocEvent {}

class GoToUserListEvent extends MainBlocEvent {
  final UserListType userListType;

  GoToUserListEvent(this.userListType);

  @override
  bool shouldLogEvent() => false;
}
