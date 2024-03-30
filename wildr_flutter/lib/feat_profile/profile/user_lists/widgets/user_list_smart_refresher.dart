import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followers_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followings_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/inner_circle_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/user_list_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/user_list_tile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';

class UserListSmartRefresher extends StatefulWidget {
  final UserListType userListType;
  final WildrUser user;
  final bool isOnCurrentUserPage;

  const UserListSmartRefresher(
    this.userListType, {
    super.key,
    required this.user,
    required this.isOnCurrentUserPage,
  });

  @override
  State<UserListSmartRefresher> createState() => _UserListSmartRefresherState();
}

class _UserListSmartRefresherState extends State<UserListSmartRefresher>
    with AutomaticKeepAliveClientMixin<UserListSmartRefresher> {
  late final UserListHandler _handler;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    switch (widget.userListType) {
      case UserListType.FOLLOWING:
        _handler =
            userListLocator<FollowingsHandler>(instanceName: widget.user.id);
      case UserListType.FOLLOWERS:
        _handler =
            userListLocator<FollowersHandler>(instanceName: widget.user.id);
      case UserListType.INNER_CIRCLE:
        _handler =
            userListLocator<InnerCircleHandler>(instanceName: widget.user.id);
    }
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: (context, state) {
        if (state is RefreshUserListPageState) {
          if (state.id == widget.user.id) setState(() {});
        } else {
          _handler.handleListeners(state);
        }
        if (state is FollowingsTabUnfollowCTAState &&
            state.isSuccessful &&
            widget.userListType == UserListType.INNER_CIRCLE) {
          // Need to refresh Inner Circle list since
          // unfollowing a user who is also part of one's inner circle,
          // must also be removed form the IC,
          // thus the IC list must be refreshed
          _handler.refreshController.requestRefresh(needMove: false);
        }
      },
      child: SmartRefresher(
        controller: _handler.refreshController,
        onRefresh: () =>
            _handler.onRefresh(widget.userListType, widget.user.id),
        onLoading: () =>
            _handler.onLoadMore(widget.userListType, widget.user.id),
        enablePullUp: !_handler.refreshController.isRefresh,
        header: const MaterialClassicHeader(),
        footer: createEmptyPaginationFooter(),
        child: ListView.builder(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
          shrinkWrap: true,
          itemCount: _handler.users.length,
          itemBuilder: (_, index) => UserListTile(
            user: _handler.users[index],
            userListType: widget.userListType,
            currentPageUser: widget.user,
            index: index,
          ),
        ),
      ),
    );
  }
}
