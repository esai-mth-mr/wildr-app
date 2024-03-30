// ignore_for_file: avoid_positional_boolean_parameters

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/popups/profile_page_popups.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_tab_viewer.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followers_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/followings_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/inner_circle_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/page/followers_tab.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/page/following_tab.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/page/inner_circle_tab.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/add_from_contacts_button.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[FollowerFollowingPage]: $message');
}

class UserListsPage extends StatefulWidget {
  final bool isCurrentUser;
  final WildrUser user;
  final UserListType selectedUserListTypeFromPreviousPage;
  final bool isUserLoggedIn;

  const UserListsPage(
    this.user,
    this.isCurrentUser,
    this.isUserLoggedIn,
    this.selectedUserListTypeFromPreviousPage, {
    super.key,
  });

  @override
  State<UserListsPage> createState() => _UserListsPageState();
}

class _UserListsPageState extends State<UserListsPage>
    with SingleTickerProviderStateMixin {
  late WildrUser _user;
  String _currentUserId = '';
  late final List<UserListTabViewer> _userListTabViewer;
  late final TabController _tabController;
  int activeIndex = 0;
  @override
  void initState() {
    _setupUser();
    _setupTabs();
    _setupServices();
    _tabControllerListenerAndSetup();
    super.initState();
  }

  void _setupTabs() {
    _userListTabViewer = widget.isCurrentUser
        ? [
            UserListTabViewer(UserListType.INNER_CIRCLE),
            UserListTabViewer(UserListType.FOLLOWING),
            UserListTabViewer(UserListType.FOLLOWERS),
          ]
        : [
            UserListTabViewer(
              UserListType.FOLLOWING,
              isDisabled: _user.visibilityPreferences?.list.following !=
                  UserListVisibility.EVERYONE,
            ),
            UserListTabViewer(
              UserListType.FOLLOWERS,
              isDisabled: _user.visibilityPreferences?.list.follower !=
                  UserListVisibility.EVERYONE,
            ),
          ];
  }

  UserListType _getSelectedTab() =>
      _userListTabViewer[_tabController.index].type;

  void _setupUser() {
    if (widget.isUserLoggedIn) {
      _currentUserId = Common().mainBloc(context).currentUserId;
    }
    if (widget.isCurrentUser) {
      final CurrentUserProfileGxC currentUserGxC =
          Get.find(tag: CURRENT_USER_TAG);
      _user = currentUserGxC.user;
    } else {
      _user = widget.user;
    }
  }

  void _setupServices() {
    for (final e in _userListTabViewer) {
      setupUserListServices(e.type, _user.id);
    }
    for (final e in _userListTabViewer) {
      switch (e.type) {
        case UserListType.FOLLOWING:
          userListLocator<FollowingsHandler>(instanceName: _user.id)
              .init(context, widget.isCurrentUser, _user, e.type);
        case UserListType.FOLLOWERS:
          userListLocator<FollowersHandler>(instanceName: _user.id)
              .init(context, widget.isCurrentUser, _user, e.type);
        case UserListType.INNER_CIRCLE:
          userListLocator<InnerCircleHandler>(instanceName: _user.id)
              .init(context, widget.isCurrentUser, _user, e.type);
      }
    }
  }

  void _tabControllerListenerAndSetup() {
    _tabController = TabController(
      length: _userListTabViewer.length,
      vsync: this,
      initialIndex:
          _getTabIndexFromType(widget.selectedUserListTypeFromPreviousPage),
    );
    _tabController.animation?.addListener(() {
      // Only log the screen if the index is not changing.
      // This is to prevent logging the screen
      // twice when the user taps on a tab.
      if (_tabController.indexIsChanging) {
        if (activeIndex != _tabController.index) {
          activeIndex = _tabController.index;
        }
        // this will catch a tab change by swipe
      } else {
        final int temp = _tabController.animation!.value.round();
        if (activeIndex != temp) {
          activeIndex = temp;
          // this will make the tab bar animation to happen right away instead a
          // t the end of the swipe animation
          _tabController.index = activeIndex;
          const List<String> routeNames = [
            'Inner-Circle-Tab',
            'Following-Tab',
            'Followers-Tab',
          ];

          // Log the current selected tab to analytics.
          FirebaseAnalytics.instance
              .setCurrentScreen(screenName: routeNames[_tabController.index]);
        }
      }

      if (_userListTabViewer[_tabController.index].isDisabled) {
        ProfilePagePopups(context)
            .showRestrictedList(_userListTabViewer[_tabController.index].type);
        final int index = _tabController.previousIndex;
        _tabController.index = index;
      }
      setState(() {});
    });
  }

  int _getTabIndexFromType(UserListType type) => _userListTabViewer
      .map((e) => e.type)
      .toList()
      .indexWhere((e) => e == type);

  @override
  void dispose() {
    for (final e in _userListTabViewer) {
      disposeUserListServices(e.type, _user.id);
    }
    _tabController.dispose();
    super.dispose();
  }

  Widget _getTabPage(UserListType userListType) {
    switch (userListType) {
      case UserListType.FOLLOWING:
        return FollowingTab(
          user: _user,
          isCurrentUser: widget.isCurrentUser,
          currentUserId: _currentUserId,
          isUserLoggedIn: widget.isUserLoggedIn,
        );
      case UserListType.FOLLOWERS:
        return FollowersTab(
          user: _user,
          currentUserId: _currentUserId,
          isCurrentUser: widget.isCurrentUser,
          isUserLoggedIn: widget.isUserLoggedIn,
        );
      case UserListType.INNER_CIRCLE:
        return InnerCircleTab(
          user: _user,
          currentUserId: _currentUserId,
          isCurrentUser: widget.isCurrentUser,
          isUserLoggedIn: widget.isUserLoggedIn,
        );
    }
  }

  TabBar _tabBar() => TabBar(
        controller: _tabController,
        isScrollable: _tabController.length > 2,
        tabs: _userListTabViewer
            .map(
              (e) => Tab(
                text: !e.isDisabled
                    ? e.type.toCompactCountString(_user.userStats)
                    : null,
                child: e.isDisabled
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const WildrIcon(
                            WildrIcons.lock_closed_filled,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 10),
                          Text(e.type.toViewString()),
                        ],
                      )
                    : null,
              ),
            )
            .toList(),
      );

  AppBar _appbar() => AppBar(
        centerTitle: false,
        title: Text(_user.handle),
        actions: (_getTabIndexFromType(UserListType.INNER_CIRCLE) ==
                        _tabController.index ||
                    _getTabIndexFromType(UserListType.FOLLOWING) ==
                        _tabController.index) &&
                widget.user.userStats.followingCount > 0 &&
                _user.isCurrentUser
            ? [AddFromContactsButton(_getSelectedTab())]
            : null,
        bottom: _tabBar(),
      );

  TabBarView _tabBarView() => TabBarView(
        controller: _tabController,
        physics: _userListTabViewer.indexWhere((e) => e.isDisabled) != -1
            ? const NeverScrollableScrollPhysics()
            : null,
        children: _userListTabViewer.map((e) => _getTabPage(e.type)).toList(),
      );

  @override
  Widget build(BuildContext context) => DefaultTabController(
        initialIndex:
            _getTabIndexFromType(widget.selectedUserListTypeFromPreviousPage),
        length: _userListTabViewer.length,
        child: Scaffold(
          appBar: _appbar(),
          body: BlocListener<MainBloc, MainState>(
            listener: (context, state) {
              setState(() {});
              if (state is CurrentUserProfileRefreshState) {
                if (widget.isCurrentUser) {
                  final CurrentUserProfileGxC currentUserGxC =
                      Get.find(tag: CURRENT_USER_TAG);
                  _user = currentUserGxC.user;
                }
              }
            },
            child: _tabBarView(),
          ),
        ),
      );
}
