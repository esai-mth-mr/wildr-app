import 'package:wildr_flutter/common/enums/smart_refresher/smart_refresher_action.dart';
import 'package:wildr_flutter/common/enums/smart_refresher/smart_refresher_refresh_state.dart';
import 'package:wildr_flutter/common/errors/smart_refresher/smart_refresher_error.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/user_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_response.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

extension UserListActionsCommons on UserListActions {
  UserListResponse populateUserList(
    SmartRefresherRefreshState refreshState,
    String? errorMessage,
    List<WildrUser> oldUsers,
    List<WildrUser> newUsers,
    // ignore: avoid_positional_boolean_parameters
    bool isSuggestion,
  ) {
    if (errorMessage == null) {
      switch (refreshState) {
        case SmartRefresherRefreshState.IS_REFRESHING:
          return UserListResponse(
            users: newUsers,
            refresherAction: SmartRefresherAction.REFRESH_COMPLETE,
            isSuggestion: isSuggestion,
          );
        case SmartRefresherRefreshState.IS_LOADING:
          if (newUsers.isEmpty) {
            return UserListResponse(
              refresherAction: SmartRefresherAction.LOAD_NO_MORE_DATA,
              users: oldUsers,
              isSuggestion: isSuggestion,
            );
          } else {
            oldUsers.addAll(newUsers);
            return UserListResponse(
              users: oldUsers,
              refresherAction: SmartRefresherAction.LOAD_COMPLETE,
              isSuggestion: isSuggestion,
            );
          }
        case SmartRefresherRefreshState.NONE:
          return UserListResponse(
            users: oldUsers,
            refresherAction: SmartRefresherAction.LOAD_COMPLETE,
            isSuggestion: isSuggestion,
          );
      }
    } else {
      switch (refreshState) {
        case SmartRefresherRefreshState.IS_REFRESHING:
          throw SmartRefresherError(
            code: SmartRefresherAction.REFRESH_FAILED,
            message: errorMessage,
          );
        case SmartRefresherRefreshState.IS_LOADING:
          throw SmartRefresherError(
            code: SmartRefresherAction.LOAD_FAILED,
            message: errorMessage,
          );
        case SmartRefresherRefreshState.NONE:
          throw SmartRefresherError(
            code: SmartRefresherAction.LOAD_FAILED,
            message: errorMessage,
          );
      }
    }
  }
}
