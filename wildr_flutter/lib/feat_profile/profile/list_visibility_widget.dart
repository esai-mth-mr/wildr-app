import 'package:flutter/cupertino.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/popups/profile_page_bottom_sheets.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ListVisibilityWidget extends StatefulWidget {
  final ListVisibility listVisibility;

  const ListVisibilityWidget(this.listVisibility, {super.key});

  @override
  State<ListVisibilityWidget> createState() => _ListVisibilityWidgetState();
}

class _ListVisibilityWidgetState extends State<ListVisibilityWidget> {
  ListVisibility get _listVisibility => widget.listVisibility;

  @override
  void initState() {
    super.initState();
  }

  CupertinoSwitch _followerSwitch() => CupertinoSwitch(
      activeColor: WildrColors.primaryColor,
      value: _listVisibility.follower == UserListVisibility.NONE,
      onChanged: (value) {
        final UserListVisibilityActions action = !value
            ? UserListVisibilityActions.SHOW_FOLLOWER_LIST
            : UserListVisibilityActions.HIDE_FOLLOWER_LIST;
        final UserListVisibility followerVisibility =
            !value ? UserListVisibility.EVERYONE : UserListVisibility.NONE;
        ProfilePageBottomSheets(context).updateListVisibility(
          action,
          ListVisibility(
            follower: followerVisibility,
            following: _listVisibility.following,
          ),
        );
      },
    );

  CupertinoSwitch _followingSwitch() => CupertinoSwitch(
      activeColor: WildrColors.primaryColor,
      value: _listVisibility.following == UserListVisibility.NONE,
      onChanged: (value) {
        final UserListVisibilityActions action = !value
            ? UserListVisibilityActions.SHOW_FOLLOWING_LIST
            : UserListVisibilityActions.HIDE_FOLLOWING_LIST;
        final UserListVisibility followingListVisibility =
            !value ? UserListVisibility.EVERYONE : UserListVisibility.NONE;
        ProfilePageBottomSheets(context).updateListVisibility(
          action,
          ListVisibility(
            follower: _listVisibility.follower,
            following: followingListVisibility,
          ),
        );
      },
    );

  Row _tile(bool isFollower) => Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text("Hide your ${isFollower ? 'follower' : 'following'} list"),
        if (isFollower) _followerSwitch() else _followingSwitch(),
      ],
    );

  @override
  Widget build(BuildContext context) => Column(
      children: [
        _tile(true),
        const SizedBox(height: 5),
        _tile(false),
      ],
    );
}
