import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/empty_user_list_add_from_contact_widget.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/user_list_smart_refresher.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class FollowingTab extends StatefulWidget {
  final WildrUser user;
  final String currentUserId;
  final bool isCurrentUser;
  final bool isUserLoggedIn;

  const FollowingTab({
    required this.user,
    required this.currentUserId,
    required this.isCurrentUser,
    required this.isUserLoggedIn,
    super.key,
  });

  @override
  State<FollowingTab> createState() => _FollowingTabState();
}

class _FollowingTabState extends State<FollowingTab> {
  Widget _emptyListResult(BuildContext context) {
    if (!widget.isCurrentUser) return Container();
    return const Padding(
      padding: EdgeInsets.all(8.0),
      child: EmptyUserListAddFromContactWidget(UserListType.FOLLOWING),
    );
  }

  @override
  Widget build(BuildContext context) => widget.user.userStats.followingCount > 0
        ? BlocListener<MainBloc, MainState>(
            listener: (context, state) {
              if (state is RefreshUserListPageState) {
                if (state.id == widget.user.id) setState(() {});
              }
            },
            child: UserListSmartRefresher(
              UserListType.FOLLOWING,
              user: widget.user,
              isOnCurrentUserPage: widget.isCurrentUser,
            ),
          )
        : _emptyListResult(context);
}
