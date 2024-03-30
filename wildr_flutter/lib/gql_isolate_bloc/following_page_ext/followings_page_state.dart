// ignore_for_file: avoid_positional_boolean_parameters

import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class FollowingsTabFollowCTAState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;
  final int? index;
  final String? userId;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;

  FollowingsTabFollowCTAState(
    this.isSuccessful,
    this.errorMessage,
    this.index,
    this.userId,
  )   : userListType = UserListType.FOLLOWING,
        userListEvent = UserListCTAEvent.FOLLOW,
        super();
}

class FollowingsTabUnfollowCTAState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;
  final int? index;
  final String? userId;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;

  FollowingsTabUnfollowCTAState(
    this.isSuccessful,
    this.errorMessage,
    this.index,
    this.userId,
  )   : userListEvent = UserListCTAEvent.UNFOLLOW,
        userListType = UserListType.FOLLOWING,
        super();
}

class FollowingTabPaginateMembersListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;
  final UserListType userListType;

  FollowingTabPaginateMembersListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
  }) : userListType = UserListType.FOLLOWING;
}
