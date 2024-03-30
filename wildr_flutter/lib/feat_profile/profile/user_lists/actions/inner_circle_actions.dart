import 'package:flutter/material.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/user_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/inner_circle_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/popups/user_list_bottom_sheets.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_events.dart';
import 'package:wildr_flutter/home/model/pagination_input.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/services/invite_code_actions.dart';

class InnerCircleActions extends UserListActions {
  InnerCircleActions(super.context);

  @override
  void refresh({String? userId, bool isSuggestion = false}) {
    Common().mainBloc(context).add(
          ICPaginateMembersListEvent(
            PaginationInput(),
            isSuggestion,
          ),
        );
  }

  @override
  void loadMore({
    required String? endCursor,
    String? userId,
    bool isSuggestion = false,
  }) {
    Common().mainBloc(context).add(
          ICPaginateMembersListEvent(
            PaginationInput(after: endCursor),
            isSuggestion,
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
    final handler =
        userListLocator<InnerCircleHandler>(instanceName: currentPageUser.id);
    switch (userListEvents) {
      case UserListCTAEvent.FOLLOW:
        throw Exception('You cannot follow inner lists');
      case UserListCTAEvent.UNFOLLOW:
        throw Exception('You cannot follow unfollow inner lists');
      case UserListCTAEvent.REMOVE:
        UserListBottomSheets(context).removeInnerCircleUser(
          handle: user.handle,
          onPressed: () {
            Common()
                .mainBloc(context)
                .add(ICRemoveMemberEvent(user.id, index: index));
            handler.updateIsInnerCircle(false, index);
            // TODO: Handler switches add -> remove
            Navigator.pop(context);
          },
        );
      case UserListCTAEvent.ADD:
        Common().mainBloc(context).add(ICAddMemberEvent(user.id, index: index));
        handler.updateIsInnerCircle(true, index);
    }
  }

  Future<void> generateInviteCode({String? pageId, String? phoneNumber}) async {
    Common().mainBloc(context).add(
          GenerateInviteCodeEvent(
            inviteCodeAction: InviteCodeAction.ADD_TO_INNER_LIST,
            phoneNumber: phoneNumber,
            userListType: UserListType.INNER_CIRCLE,
            pageId: pageId,
          ),
        );
  }
}
