import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/user_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followers_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/popups/user_list_bottom_sheets.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_event.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class FollowersListActions extends UserListActions {
  FollowersListActions(super.context);

  @override
  void refresh({String? userId}) {
    if (userId == null) throw Exception('Please add a user id');
    Common()
        .mainBloc(context)
        .add(FollowersTabPaginateMembersListEvent(userId));
  }

  @override
  void loadMore({
    String? userId,
    required String? endCursor,
  }) {
    if (userId == null) throw Exception('Please add a user id');
    Common()
        .mainBloc(context)
        .add(FollowersTabPaginateMembersListEvent.loadMore(userId, endCursor));
  }

  @override
  void action({
    required UserListCTAEvent userListEvents,
    required WildrUser user,
    required WildrUser currentPageUser,
    required int index,
  }) {
    final handler =
        userListLocator<FollowersHandler>(instanceName: currentPageUser.id);
    switch (userListEvents) {
      case UserListCTAEvent.FOLLOW:
        handler.updateFollowOnUser(true, index);
        Common()
            .mainBloc(context)
            .add(FollowersTabFollowUserEvent(user.id, index: index));
      case UserListCTAEvent.UNFOLLOW:
        handler.updateFollowOnUser(false, index);
        Common()
            .mainBloc(context)
            .add(FollowersTabUnfollowUserEvent(user.id, index: index));
      case UserListCTAEvent.REMOVE:
        UserListBottomSheets(context).removeFollower(
          handle: user.handle,
          onPressed: () {
            Common()
                .mainBloc(context)
                .add(FollowersTabRemoveFollowerEvent(user.id, index: index));
            Navigator.pop(context);
          },
        );
      case UserListCTAEvent.ADD:
        throw Exception('You cannot add followers please use follow');
    }
  }
}
