import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class InnerCircleRemoveMemberState extends MainState {
  final String userId;
  final int index;
  final String? errorMessage;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;
  final String? pageId;

  InnerCircleRemoveMemberState({
    required this.userId,
    required this.index,
    this.pageId,
    this.errorMessage,
  })  : userListType = UserListType.INNER_CIRCLE,
        userListEvent = UserListCTAEvent.ADD;

  bool get isSuccessful => errorMessage == null;
}

class InnerCircleAddMemberState extends MainState {
  final String userId;
  final int index;
  final String? errorMessage;
  final UserListType userListType;
  final UserListCTAEvent userListEvent;
  final String? pageId;

  InnerCircleAddMemberState({
    required this.userId,
    required this.index,
    this.pageId,
    this.errorMessage,
  })  : userListType = UserListType.INNER_CIRCLE,
        userListEvent = UserListCTAEvent.ADD;

  bool get isSuccessful => errorMessage == null;
}

class ICPaginateMembersListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;
  final UserListType userListType;
  final bool isSuggestion;

  ICPaginateMembersListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
    this.isSuggestion = false,
  }) : userListType = UserListType.INNER_CIRCLE;
}
