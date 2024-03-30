// ignore_for_file: avoid_positional_boolean_parameters

import 'package:flutter/material.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/enums/smart_refresher/smart_refresher_action.dart';
import 'package:wildr_flutter/common/enums/smart_refresher/smart_refresher_refresh_state.dart';
import 'package:wildr_flutter/common/errors/smart_refresher/smart_refresher_error.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/followers_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/followings_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/inner_circle_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/user_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/user_list_actions_commons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_response.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[UserListHandler] $message');
}

class UserListHandler {
  late BuildContext _context;
  late RefreshController refreshController;
  String? endCursor;
  List<WildrUser> users = [];
  late bool isOnCurrentUserPage;
  late WildrUser currentPageUser;
  bool isSuggestion = false;
  late UserListType _currentListType;

  void init(
    BuildContext context,
    bool isOnCurrentUserPage,
    WildrUser currentPageUser,
    UserListType listType,
  ) {
    this.isOnCurrentUserPage = isOnCurrentUserPage;
    this.currentPageUser = currentPageUser;
    _currentListType = listType;
    setContext(context);
    refreshController = RefreshController(initialRefresh: true);
  }

  // ignore: use_setters_to_change_properties
  void setContext(BuildContext context) {
    _context = context;
  }

  void onRefresh(UserListType userListType, String userId) {
    if (refreshController.isLoading) {
      debugPrint('isLoading, but trying to refresh');
    }
    userListType.refresh(context: _context, userId: userId);
    _refreshPage();
  }

  void onLoadMore(UserListType userListType, String userId) {
    if (refreshController.isRefresh) {
      refreshController.loadComplete();
      return;
    }
    userListType.loadMore(
      context: _context,
      userId: userId,
      endCursor: endCursor,
      isSuggestion: isSuggestion,
    );
  }

  void _refreshPage() {
    Common()
        .mainBloc(_context)
        .add(RefreshUserListPageEvent(currentPageUser.id));
  }

  SmartRefresherRefreshState getRefreshState() {
    if (refreshController.isLoading) {
      return SmartRefresherRefreshState.IS_LOADING;
    } else if (refreshController.isRefresh) {
      return SmartRefresherRefreshState.IS_REFRESHING;
    } else {
      return SmartRefresherRefreshState.NONE;
    }
  }

  void handleRefreshController(SmartRefresherAction action) {
    switch (action) {
      case SmartRefresherAction.REFRESH_COMPLETE:
        refreshController.refreshCompleted();
      case SmartRefresherAction.REFRESH_FAILED:
        refreshController.refreshFailed();
      case SmartRefresherAction.LOAD_NO_MORE_DATA:
        refreshController.loadNoData();
      case SmartRefresherAction.LOAD_COMPLETE:
        refreshController.loadComplete();
      case SmartRefresherAction.LOAD_FAILED:
        refreshController.loadFailed();
    }
  }

  void updateFollowOnUser(bool value, int index) {
    users[index].currentUserContext?.isFollowing = value;
    _refreshPage();
  }

  void updateIsInnerCircle(bool value, int index) {
    users[index].currentUserContext?.isInnerCircle = value;
    _refreshPage();
  }

  void _updateList({
    required UserListType userListType,
    required UserListResponse userListResponse,
    required String? endCursor,
  }) {
    if (_currentListType != userListType) return;
    handleRefreshController(userListResponse.refresherAction);
    users = userListResponse.users;
    if (users.isNotEmpty) {
      this.endCursor = users.last.id;
    } else {
      this.endCursor = '';
    }
    isSuggestion = userListResponse.isSuggestion ?? false;
    _refreshPage();
  }

  void _handleError(SmartRefresherError error) {
    Common().showErrorSnackBar(error.message);
    handleRefreshController(error.code);
  }

  void _handleLists(dynamic state) {
    late UserListActions action;
    bool isSuggestion = false;
    switch (state.userListType) {
      case UserListType.FOLLOWING:
        action = FollowingsListActions(_context);
      case UserListType.FOLLOWERS:
        action = FollowersListActions(_context);
      case UserListType.INNER_CIRCLE:
        action = InnerCircleActions(_context);
        isSuggestion = (state as ICPaginateMembersListState).isSuggestion;
    }
    try {
      _updateList(
        userListType: state.userListType,
        userListResponse: action.populateUserList(
          getRefreshState(),
          state.errorMessage,
          users,
          state.users ?? [],
          isSuggestion,
        ),
        endCursor: state.endCursor,
      );
    } on SmartRefresherError catch (error) {
      _handleError(error);
    }
  }

  void _handleButtonCTA(dynamic state) {
    bool revertTo = false;
    if (state is InnerCircleRemoveMemberState) {
      if (state.errorMessage != null) {
        Common().showErrorSnackBar(state.errorMessage ?? kSomethingWentWrong);
        if (users.length > state.index) {
          if (users[state.index].id == state.userId) {
            users[state.index].currentUserContext?.isInnerCircle = true;
            _refreshPage();
            return;
          }
        }
      }
      return;
    } else if (state is InnerCircleAddMemberState) {
      if (state.errorMessage != null) {
        Common().showErrorSnackBar(state.errorMessage ?? kSomethingWentWrong);
        if (users.length > state.index) {
          if (users[state.index].id == state.userId) {
            users[state.index].currentUserContext?.isInnerCircle = false;
            _refreshPage();
            return;
          }
        }
      }
      return;
    }
    switch (state.userListEvent) {
      case UserListCTAEvent.FOLLOW:
        users[state.index].currentUserContext?.isFollowing = true;
        revertTo = false;
      case UserListCTAEvent.UNFOLLOW:
        users[state.index].currentUserContext?.isFollowing = false;
        revertTo = true;
      case UserListCTAEvent.REMOVE:
        if (state.isSuccessful) {
          if (state.index != null) users.removeAt(state.index!);
          Common().showGetSnackBar('Removed');
        } else {
          Common().showErrorSnackBar(state.errorMessage ?? '--');
        }
        _refreshPage();
        return;
    }
    if (!state.isSuccessful) {
      Common().showErrorSnackBar(state.errorMessage!);
      if (users.length > state.index!) {
        if (users[state.index!].id == state.userId!) {
          users[state.index!].currentUserContext?.isFollowing = revertTo;
        }
      }
    }
    _refreshPage();
  }

  void handleListeners(MainState state) {
    if (state is FollowersTabPaginateMembersListState) {
      _handleLists(state);
    } else if (state is FollowingTabPaginateMembersListState) {
      _handleLists(state);
    } else if (state is ICPaginateMembersListState) {
      _handleLists(state);
    } else if (state is FollowingsTabUnfollowCTAState) {
      _handleButtonCTA(state);
    } else if (state is FollowersTabFollowState) {
      _handleButtonCTA(state);
    } else if (state is FollowersTabUnfollowState) {
      _handleButtonCTA(state);
    } else if (state is RemoveFollowerState) {
      _handleButtonCTA(state);
    } else if (state is InnerCircleAddMemberState) {
      _handleButtonCTA(state);
    } else if (state is InnerCircleRemoveMemberState) {
      _handleButtonCTA(state);
    }
  }

  void dispose() {
    refreshController.dispose();
  }
}
