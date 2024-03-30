import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followers_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followings_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/inner_circle_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/user_list_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class UserListTile extends StatelessWidget {
  final WildrUser user;
  final WildrUser currentPageUser;
  final UserListType userListType;
  final int index;

  const UserListTile({
    super.key,
    required this.user,
    required this.userListType,
    required this.index,
    required this.currentPageUser,
  });

  String _text(BuildContext context) {
    switch (userListType) {
      case UserListType.FOLLOWING:
        return (user.currentUserContext?.isFollowing ?? false)
            ? UserListCTAEvent.UNFOLLOW.toViewString()
            : UserListCTAEvent.FOLLOW.toViewString();
      case UserListType.FOLLOWERS:
        return _handler().isOnCurrentUserPage
            ? UserListCTAEvent.REMOVE.toViewString()
            : (user.currentUserContext?.isFollowing ?? false)
                ? UserListCTAEvent.UNFOLLOW.toViewString()
                : UserListCTAEvent.FOLLOW.toViewString();
      case UserListType.INNER_CIRCLE:
        return (user.currentUserContext?.isInnerCircle ?? false)
            ? UserListCTAEvent.REMOVE.toViewString()
            : 'Add';
    }
  }

  UserListHandler _handler() {
    switch (userListType) {
      case UserListType.FOLLOWING:
        return userListLocator<FollowingsHandler>(
          instanceName: currentPageUser.id,
        );
      case UserListType.FOLLOWERS:
        return userListLocator<FollowersHandler>(
          instanceName: currentPageUser.id,
        );
      case UserListType.INNER_CIRCLE:
        return userListLocator<InnerCircleHandler>(
          instanceName: currentPageUser.id,
        );
    }
  }

  void _onPressed(BuildContext context) {
    switch (userListType) {
      case UserListType.FOLLOWING:
        userListType.actions(
          context: context,
          event: (user.currentUserContext?.isFollowing ?? false)
              ? UserListCTAEvent.UNFOLLOW
              : UserListCTAEvent.FOLLOW,
          user: user,
          currentPageUser: currentPageUser,
          index: index,
        );
      case UserListType.FOLLOWERS:
        if (_handler().isOnCurrentUserPage) {
          userListType.actions(
            context: context,
            event: UserListCTAEvent.REMOVE,
            currentPageUser: currentPageUser,
            user: user,
            index: index,
          );
        } else {
          userListType.actions(
            context: context,
            event: (user.currentUserContext?.isFollowing ?? false)
                ? UserListCTAEvent.UNFOLLOW
                : UserListCTAEvent.FOLLOW,
            user: user,
            currentPageUser: currentPageUser,
            index: index,
          );
        }
      case UserListType.INNER_CIRCLE:
        if (_handler().isOnCurrentUserPage) {
          userListType.actions(
            context: context,
            event: (user.currentUserContext?.isInnerCircle ?? false)
                ? UserListCTAEvent.REMOVE
                : UserListCTAEvent.ADD,
            currentPageUser: currentPageUser,
            user: user,
            index: index,
          );
        }
    }
  }

  bool _shouldHideEmoji() {
    if (userListType == UserListType.INNER_CIRCLE) {
      return user.currentUserContext?.isInnerCircle ?? false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) => ListTile(
      leading: Common().avatarFromUser(context, user),
      title: Text(
        user.handle,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: Text(user.name ?? ''),
      trailing: (user.id != Common().currentUserId(context))
          ? userListType.getButton(
              text: _text(context),
              onPressed: () => _onPressed(context),
              shouldHideEmoji: _shouldHideEmoji(),
            )
          : null,
      onTap: () {
        Common().openProfilePage(
          context,
          user.id,
          shouldNavigateToCurrentUser: false,
        );
      },
    );
}
