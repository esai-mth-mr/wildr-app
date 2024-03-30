import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

enum UserListVisibilityActions {
  HIDE_FOLLOWING_LIST,
  SHOW_FOLLOWING_LIST,
  HIDE_FOLLOWER_LIST,
  SHOW_FOLLOWER_LIST
}

extension UserListVisibilityActionsExt on UserListVisibilityActions {
  String toBottomSheetTitle(BuildContext context) {
    switch (this) {
      case UserListVisibilityActions.HIDE_FOLLOWING_LIST:
        return AppLocalizations.of(context)!.profile_hideFollowingList;
      case UserListVisibilityActions.SHOW_FOLLOWING_LIST:
        return AppLocalizations.of(context)!.profile_showFollowingList;
      case UserListVisibilityActions.HIDE_FOLLOWER_LIST:
        return AppLocalizations.of(context)!.profile_hideFollowerList;
      case UserListVisibilityActions.SHOW_FOLLOWER_LIST:
        return AppLocalizations.of(context)!.profile_showFollowerList;
    }
  }

  String toBottomSheetBody(BuildContext context) {
    switch (this) {
      case UserListVisibilityActions.HIDE_FOLLOWING_LIST:
        return AppLocalizations.of(context)!.profile_hideFollowingListDesc;
      case UserListVisibilityActions.SHOW_FOLLOWING_LIST:
        return AppLocalizations.of(context)!.profile_showFollowingListDesc;
      case UserListVisibilityActions.HIDE_FOLLOWER_LIST:
        return AppLocalizations.of(context)!.profile_hideFollowerListDesc;
      case UserListVisibilityActions.SHOW_FOLLOWER_LIST:
        return AppLocalizations.of(context)!.profile_showFollowerListDesc;
    }
  }
}
