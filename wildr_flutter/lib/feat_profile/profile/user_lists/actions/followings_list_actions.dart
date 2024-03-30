import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/user_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followings_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_event.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/services/invite_code_actions.dart';

class FollowingsListActions extends UserListActions {
  FollowingsListActions(super.context);

  @override
  void refresh({String? userId}) {
    if (userId == null) throw Exception('Please add a user id');
    Common()
        .mainBloc(context)
        .add(FollowingsTabPaginateMembersListEvent(userId));
  }

  @override
  void loadMore({
    String? userId,
    required String? endCursor,
  }) {
    if (userId == null) throw Exception('Please add a user id');
    Common().mainBloc(context).add(
          FollowingsTabPaginateMembersListEvent.loadMore(
            userId,
            endCursor,
          ),
        );
  }

  @override
  void action({
    required UserListCTAEvent userListEvents,
    required WildrUser user,
    required WildrUser currentPageUser,
    required int index,
  }) {
    final FollowingsHandler handler =
        userListLocator<FollowingsHandler>(instanceName: currentPageUser.id);
    switch (userListEvents) {
      case UserListCTAEvent.FOLLOW:
        handler.updateFollowOnUser(true, index);
        Common()
            .mainBloc(context)
            .add(FollowingsTabFollowUserEvent(user.id, index: index));
      case UserListCTAEvent.UNFOLLOW:
        handler.updateFollowOnUser(false, index);
        Common()
            .mainBloc(context)
            .add(FollowingsTabUnfollowUserEvent(user.id, index: index));
      case UserListCTAEvent.REMOVE:
        throw Exception('You cannot remove followings');
      case UserListCTAEvent.ADD:
        throw Exception('You cannot add followings');
    }
  }

  Future<void> generateDeepLinkInviteCode(String phoneNumber) async {
    Common().mainBloc(context).add(
          GenerateInviteCodeEvent(
            inviteCodeAction: InviteCodeAction.ADD_TO_FOLLOWING_LIST,
            phoneNumber: phoneNumber,
            userListType: UserListType.FOLLOWING,
          ),
        );
  }
}
