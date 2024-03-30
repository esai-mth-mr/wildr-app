import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/user_list_smart_refresher.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class FollowersTab extends StatelessWidget {
  final WildrUser user;
  final String currentUserId;
  final bool isCurrentUser;
  final bool isUserLoggedIn;

  const FollowersTab({
    required this.user,
    required this.currentUserId,
    required this.isCurrentUser,
    required this.isUserLoggedIn,
    super.key,
  });

  @override
  Widget build(BuildContext context) => UserListSmartRefresher(
      UserListType.FOLLOWERS,
      user: user,
      isOnCurrentUserPage: isCurrentUser,
    );
}
