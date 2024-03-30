// ignore_for_file: avoid_positional_boolean_parameters

import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class FollowersTabFollowState extends MainState {
  FollowersTabFollowState(
    this.errorMessage,
    this.index,
    this.userId, {
    required this.isSuccessful,
  })  : userListType = UserListType.FOLLOWERS,
        userListEvent = UserListCTAEvent.FOLLOW,
        super();
  final bool isSuccessful;
  final String? errorMessage;
  final int? index;
  final String? userId;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;
}

class FollowersTabUnfollowState extends MainState {
  FollowersTabUnfollowState(
    this.errorMessage,
    this.index,
    this.userId, {
    required this.isSuccessful,
  })  : userListType = UserListType.FOLLOWERS,
        userListEvent = UserListCTAEvent.UNFOLLOW,
        super();
  final bool isSuccessful;
  final String? errorMessage;
  final int? index;
  final String? userId;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;
}

class RemoveFollowerState extends MainState {
  RemoveFollowerState(
    this.errorMessage,
    this.index,
    this.userId, {
    required this.isSuccessful,
  })  : userListType = UserListType.FOLLOWERS,
        userListEvent = UserListCTAEvent.REMOVE,
        super();
  final bool isSuccessful;
  final String? errorMessage;
  final int? index;
  final String? userId;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;
}

class FollowersTabPaginateMembersListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;
  final UserListType userListType;

  FollowersTabPaginateMembersListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
  }) : userListType = UserListType.FOLLOWERS;
}
