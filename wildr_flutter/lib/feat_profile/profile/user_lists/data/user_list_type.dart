import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/followers_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/followings_list_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/inner_circle_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/buttons/wildr_outline_button.dart';

enum UserListType { FOLLOWING, FOLLOWERS, INNER_CIRCLE }

extension UserListTypeExt on UserListType {
  String toCompactCountString(UserStats userStats) {
    switch (this) {
      case UserListType.FOLLOWING:
        return '${Common().toCompactCount(userStats.followingCount)}'
            ' ${toViewString(userStats)}';
      case UserListType.FOLLOWERS:
        return '${Common().toCompactCount(userStats.followerCount)}'
            ' ${toViewString(userStats)}';
      case UserListType.INNER_CIRCLE:
        return '${Common().toCompactCount(userStats.innerCircleCount)}'
            ' ${toViewString(userStats)}';
    }
  }

  String toViewString([UserStats? userStats]) {
    String withSString(int count) => (count == 1) ? '' : 's';
    switch (this) {
      case UserListType.FOLLOWING:
        return 'Following';
      case UserListType.FOLLOWERS:
        return 'Follower${withSString(userStats?.followerCount ?? 0)}';
      case UserListType.INNER_CIRCLE:
        return 'Inner Circle';
    }
  }

  void refresh({required BuildContext context, required String userId}) {
    switch (this) {
      case UserListType.FOLLOWING:
        FollowingsListActions(context).refresh(userId: userId);
      case UserListType.FOLLOWERS:
        FollowersListActions(context).refresh(userId: userId);
      case UserListType.INNER_CIRCLE:
        InnerCircleActions(context).refresh();
    }
  }

  void loadMore({
    required BuildContext context,
    required String userId,
    required String? endCursor,
    bool isSuggestion = false,
  }) {
    switch (this) {
      case UserListType.FOLLOWING:
        FollowingsListActions(context).loadMore(
          userId: userId,
          endCursor: endCursor,
        );
      case UserListType.FOLLOWERS:
        FollowersListActions(context).loadMore(
          userId: userId,
          endCursor: endCursor,
        );
      case UserListType.INNER_CIRCLE:
        InnerCircleActions(context)
            .loadMore(endCursor: endCursor, isSuggestion: isSuggestion);
    }
  }

  void actions({
    required BuildContext context,
    required UserListCTAEvent event,
    required WildrUser user,
    required WildrUser currentPageUser,
    required int index,
  }) {
    switch (this) {
      case UserListType.FOLLOWING:
        FollowingsListActions(context).action(
          userListEvents: event,
          user: user,
          index: index,
          currentPageUser: currentPageUser,
        );
      case UserListType.FOLLOWERS:
        FollowersListActions(context).action(
          userListEvents: event,
          user: user,
          index: index,
          currentPageUser: currentPageUser,
        );
      case UserListType.INNER_CIRCLE:
        InnerCircleActions(context).action(
          userListEvents: event,
          user: user,
          index: index,
          currentPageUser: currentPageUser,
        );
    }
  }

  WildrOutlineButton getButton({
    required String text,
    required VoidCallback onPressed,
    bool shouldHideEmoji = true,
  }) {
    final double width = Get.width * 0.2;
    switch (this) {
      case UserListType.FOLLOWING:
        return WildrOutlineButton(
          text: text,
          onPressed: onPressed,
          width: width,
        );
      case UserListType.FOLLOWERS:
        return WildrOutlineButton(
          text: text,
          onPressed: onPressed,
          width: width,
        );
      case UserListType.INNER_CIRCLE:
        if (shouldHideEmoji) {
          return WildrOutlineButton(
            text: text,
            onPressed: onPressed,
            width: width,
          );
        } else {
          return WildrOutlineButton.emoji(
            emoji: WildrIconsPng.inner_circle,
            text: text,
            onPressed: onPressed,
            width: width,
          );
        }
    }
  }

  String getEmptyListAddFromContactsString() {
    switch (this) {
      case UserListType.FOLLOWING:
        return "Don't see anyone to follow? Invite them!";
      case UserListType.FOLLOWERS:
        return 'Get the party started. Invite your '
            'contacts to your Followers!';
      case UserListType.INNER_CIRCLE:
        return 'Get the party started. Invite your'
            ' contacts to your Inner Circle!';
    }
  }

  void generateInviteCode(BuildContext context, String phoneNumber) {
    switch (this) {
      case UserListType.FOLLOWING:
        FollowingsListActions(context).generateDeepLinkInviteCode(phoneNumber);
      case UserListType.FOLLOWERS:
        throw UnimplementedError('This feature has not been implemented');
      case UserListType.INNER_CIRCLE:
        InnerCircleActions(context).generateInviteCode(
          phoneNumber: phoneNumber,
        );
    }
  }

  String getSendSmsString(String link) {
    switch (this) {
      case UserListType.FOLLOWING:
        return 'Hey! I want to follow you on Wildr.'
            ' Tap the link to join: $link';
      case UserListType.FOLLOWERS:
        return 'Hey! I want to be your follower on Wildr.'
            ' Tap the link to join: $link';
      case UserListType.INNER_CIRCLE:
        return 'Hey! I want to add you to my Inner Circle on Wildr. '
            'Tap the link to join: $link';
    }
  }
}
