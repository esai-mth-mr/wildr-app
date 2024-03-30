import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart' as pull_to_refresh;
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_feed/feed_page_top_view.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_bottom_view.dart';
import 'package:wildr_flutter/feat_post/post_widget.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/double_tap_to_like_wrapper.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('FeedPage: $message');
}

enum FeedPostType { ALL, TEXT, IMAGE, VIDEO, MULTI_MEDIA }

extension FeedTypeParse on FeedPostType {
  String getText(BuildContext context) {
    switch (this) {
      case FeedPostType.ALL:
        return AppLocalizations.of(context)!.feed_cap_all;
      case FeedPostType.TEXT:
        return AppLocalizations.of(context)!.feed_cap_text;
      case FeedPostType.IMAGE:
        return AppLocalizations.of(context)!.feed_cap_image;
      case FeedPostType.VIDEO:
        return AppLocalizations.of(context)!.feed_cap_video;
      case FeedPostType.MULTI_MEDIA:
        return AppLocalizations.of(context)!.feed_cap_collage;
    }
  }

  WildrIcon getLogo({double? size, Color? color}) {
    switch (this) {
      case FeedPostType.ALL:
        return WildrIcon(
          WildrIcons.view_grid_outline,
          color: color,
          size: size,
        );
      case FeedPostType.TEXT:
        return WildrIcon(
          WildrIcons.pencil_outline,
          color: color,
          size: size,
        );
      case FeedPostType.IMAGE:
        return WildrIcon(
          WildrIcons.photograph_outline,
          color: color,
          size: size,
        );
      case FeedPostType.VIDEO:
        return WildrIcon(
          WildrIcons.video_camera_outline,
          color: color,
          size: size,
        );
      case FeedPostType.MULTI_MEDIA:
        return WildrIcon(
          WildrIcons.carousel_filled,
          color: color,
          size: size,
        );
    }
  }
}

enum FeedScopeType {
  PUBLIC, //Deprecated
  FOLLOWING, //Deprecated
  GLOBAL,
  PERSONALIZED,
  INNER_CIRCLE_CONSUMPTION,
  PERSONALIZED_FOLLOWING,
}

extension FeedScopeTypeParse on FeedScopeType {
  String getText(BuildContext context) {
    switch (this) {
      case FeedScopeType.PUBLIC:
        return AppLocalizations.of(context)!.feed_cap_public;
      case FeedScopeType.FOLLOWING:
        return AppLocalizations.of(context)!.feed_cap_following;
      case FeedScopeType.GLOBAL:
        return AppLocalizations.of(context)!.feed_cap_global;
      case FeedScopeType.PERSONALIZED:
        return AppLocalizations.of(context)!.feed_cap_explore;
      case FeedScopeType.PERSONALIZED_FOLLOWING:
        return AppLocalizations.of(context)!.feed_cap_following;
      case FeedScopeType.INNER_CIRCLE_CONSUMPTION:
        return AppLocalizations.of(context)!.feed_innerCircle;
    }
  }

  WildrIcon getIcon() {
    String icon;
    switch (this) {
      case FeedScopeType.PUBLIC:
        icon = WildrIcons.globe_outline;
      case FeedScopeType.FOLLOWING:
        icon = WildrIcons.user_group_outline;
      case FeedScopeType.GLOBAL:
        icon = WildrIcons.globe_outline;
      case FeedScopeType.PERSONALIZED:
        icon = WildrIcons.globe_outline;
      case FeedScopeType.INNER_CIRCLE_CONSUMPTION:
        icon = WildrIcons.inner_circle_outline;
      case FeedScopeType.PERSONALIZED_FOLLOWING:
        icon = WildrIcons.user_check_outline;
    }
    return WildrIcon(icon, color: Colors.white);
  }
}

class FeedPage extends StatefulWidget {
  final MainBloc _mainBloc;
  final bool isLoggedIn;
  final bool shouldRefreshFeed;

  const FeedPage(
    this._mainBloc, {
    required this.isLoggedIn,
    this.shouldRefreshFeed = false,
    super.key,
  });

  @override
  FeedPageState createState() => FeedPageState();
}

class FeedPageState extends State<FeedPage> with AutomaticKeepAliveClientMixin {
  late final pull_to_refresh.RefreshController _refreshController =
      pull_to_refresh.RefreshController();
  late final MainBloc _mainBloc = widget._mainBloc;
  late bool _noPostsLeft = false;
  late bool _showStartFollowingPage = false;
  late bool _showICMessagePage = false;
  bool _shouldAddBlur = false;
  late FeedGxC _feedGxC;
  late final double _topPadding = AppBar().preferredSize.height;
  late final double _bottomPadding = MediaQuery.of(context).padding.bottom;
  var _currentPage = 0;
  bool _canPaginate = false;
  String _endCursor = '';
  bool _isRefreshing = false;

  List<Post> get _posts => _feedGxC.posts;
  bool _paginating = false;
  bool _viewOnlyMode = false;
  bool _isFirstTime = true;
  FeedPostType _feedPostType = FeedPostType.ALL;
  late FeedScopeType _feedScopeType;
  int _lastVisitedIndex = -1;
  late ScrollController _scrollController;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    print('INIT STATE OF FEED_PAGFE');
    _feedGxC = Get.find(tag: HOME_FEED_PAGE_ID);
    _scrollController = ScrollController()..addListener(_scrollListener);
    _isRefreshing = true;
    if (Prefs.getString(PrefKeys.kLastSelectedFeedType) == null) {
      _feedScopeType = widget.isLoggedIn
          ? FeedScopeType.PERSONALIZED_FOLLOWING
          : FeedScopeType.GLOBAL;
    } else {
      _feedScopeType = FeedScopeType.values
          .byName(Prefs.getString(PrefKeys.kLastSelectedFeedType)!);
    }
    if (widget.shouldRefreshFeed) {
      _onRefresh();
    }
    debugPrint(_feedScopeType.toString());
  }

  //BlocListener
  void _onNewPostCreated() {
    Future.delayed(const Duration(seconds: 1)).then((value) {
      _onRefresh(shouldScrollToTop: true);
    });
    return;
  }

  void _updateCurrentVisiblePost() {
    if (_feedGxC.posts.isEmpty) {
      _feedGxC.currentPost = Post.empty();
      return;
    }
    _feedGxC.updateCurrentVisiblePost();
  }

  void _updateLastSeenCursorOnPagination() {
    if (_lastVisitedIndex > -1 &&
        _posts.isNotEmpty &&
        _lastVisitedIndex < _posts.length) {
      if (_feedScopeType == FeedScopeType.PERSONALIZED &&
          _feedPostType == FeedPostType.ALL) {
        _mainBloc.add(
          UpdateHomeFeedLastSeenCursor(
            endCursor: _endCursor,
            feedType: _feedPostType,
            scopeType: _feedScopeType,
          ),
        );
      }
    }
  }

  void _updateExploreFeedLastSeenCursorOnRefresh() {
    _lastVisitedIndex = 0;
    if (_posts.isNotEmpty && _lastVisitedIndex < _posts.length) {
      if (_feedScopeType == FeedScopeType.PERSONALIZED &&
          _feedPostType == FeedPostType.ALL) {
        _mainBloc.add(
          UpdateHomeFeedLastSeenCursor(
            endCursor: _posts[_lastVisitedIndex].id,
            feedType: _feedPostType,
            scopeType: _feedScopeType,
            isRefresh: true,
          ),
        );
        _lastVisitedIndex = -1;
      }
    }
  }

  void _onFeedUpdated(HomeFeedUpdateState state) {
    print('_onFeedUpdated');
    if (state.isSuccessful) {
      _endCursor = state.endCursor;
      if (_endCursor.isEmpty) {
        _refreshController.loadNoData();
      }
      if (_isRefreshing) {
        print('_isRefreshing');
        _isRefreshing = false;
        if (!_isFirstTime) {
          _refreshController.refreshCompleted();
        }
        if (state.posts.isEmpty) {
          print('empty posts');
          _refreshController.loadNoData();
          _posts.clear();
          _setCurrentVisiblePost(Post.empty());
          _feedGxC.currentIndex = 0;
          debugPrint('ScopeTye = $_feedScopeType');
          if (_feedScopeType == FeedScopeType.PERSONALIZED_FOLLOWING) {
            _showStartFollowingPage = true;
          } else if (_feedScopeType == FeedScopeType.INNER_CIRCLE_CONSUMPTION) {
            _showICMessagePage = true;
          } else {
            _noPostsLeft = true;
          }
        } else {
          print('setting posts');
          _feedGxC
            ..posts = state.posts
            ..currentIndex = 0;
          _setCurrentVisiblePost(_posts.first);
          _updateExploreFeedLastSeenCursorOnRefresh();
        }
        if (shouldScrollToTopAfterRefresh ?? false) {
          debugPrint('shouldScrollToTopAfterRefresh');
          shouldScrollToTopAfterRefresh = null;
          _scrollToTheTop(animate: false);
        }
        Common().delayIt(() {
          _refreshController.refreshCompleted();
        });
      } else {
        _refreshController.loadComplete();
        if (_paginating) {
          debugPrint('_paginating');
          _paginating = false;
        }
        _feedGxC.posts = state.posts;
        _updateCurrentVisiblePost();
        if (_feedGxC.posts.isEmpty) {
          if (_feedScopeType == FeedScopeType.PERSONALIZED_FOLLOWING) {
            _showStartFollowingPage = true;
          } else if (_feedScopeType == FeedScopeType.INNER_CIRCLE_CONSUMPTION) {
            _showICMessagePage = true;
          } else {
            _noPostsLeft = true;
          }
        }
      }
      if (_shouldAddBlur) {
        _removeBlur();
      }
      if (_isFirstTime && _posts.isNotEmpty) {
        _setCurrentVisiblePost(_posts.first);
      }
    } else {
      Common().showErrorSnackBar(state.errorMessage, context);
      _refreshController.refreshCompleted();
      if (_shouldAddBlur) {
        _removeBlur();
      }
    }
    _isFirstTime = false;
    if (mounted) setState(() {});
  }

  Future<void> _blocListener(BuildContext context, MainState state) async {
    // print("Bloc Listener ${state.runtimeType}");
    if (state is NewPostCreatedState || state is RepostCreatedState) {
      _onNewPostCreated();
    } else if (state is HomeFeedUpdateState) {
      _onFeedUpdated(state);
    } else if (state is CanPaginateHomeFeedState) {
      setState(() {
        _canPaginate = state.canPaginate;
      });
    } else if (state is ScrollToTheTopOfHomeFeedState) {
      _scrollToTheTop();
    } else if (state is ReloadFeedState) {
      _onRefresh();
    } else if (state is ReportPostState) {
      if (state.isSuccessful) {
        await Common().showSuccessDialog(
          context,
          title: _appLocalizations.feed_postReported,
          message: reportDoneText,
        );
      } else {
        Common().showErrorSnackBar(state.errorMessage!, context);
      }
    } else if (state is AddCommentsState) {
      setState(() {});
    } else if (state is DeletePostState) {
      if (state.isSuccessful) _onRefresh(shouldScrollToTop: true);
      context.loaderOverlay.hide();
    } else if (state is ToggleViewOnlyModeState) {
      _viewOnlyMode = state.hideAll;
      setState(() {});
    } else if (state is HomeFeedVariablesUpdatedState) {
      Common().delayIt(
        () {
          print('Setting state');
          setState(() {
            _refreshController.requestRefresh();
          });
        },
      );
    } else if (state is AppUnauthenticatedState) {
      debugPrint('Sign out Successful');
      if (_feedScopeType == FeedScopeType.GLOBAL) {
        print('Already on global feed');
        return;
      }
      setState(() {
        _feedPostType = FeedPostType.ALL;
        _feedScopeType = FeedScopeType.GLOBAL;
      });
      _updateFilters();
    } else if (state is OnFeedScopeTypeChangedState) {
      _addBlur();
      _feedScopeType = state.scopeType;
      setState(() {});
      if (state.isAuthenticated) {
        await Prefs.setString(
          PrefKeys.kLastSelectedFeedType,
          _feedScopeType.name,
        );
      }
      _scrollToTheTop();
    } else if (state is AuthenticationSuccessfulState) {
      _addBlur();
    }
  }

  //FeedList
  void _setCurrentVisiblePost(Post post) {
    _feedGxC.currentPost = post;
    _feedGxC.isCaptionExpanded.value = false;
  }

  void _paginate() {
    debugPrint('_paginate()');
    if (_posts.isEmpty) {
      debugPrint('Post is empty so Refreshing');
      _onRefresh();
      return;
    }
    if (_endCursor.isEmpty) {
      debugPrint('End cursor is empty');
      if (_feedScopeType == FeedScopeType.PERSONALIZED) {
        _mainBloc.logCustomEvent(AnalyticsEvents.kConsumedExploreFeed);
      } else {
        print('LOAD NO DATA');
        _refreshController.loadNoData();
        return;
      }
    }
    _paginating = true;
    _mainBloc.add(
      PaginateHomeFeedEvent(
        filterEnum: _feedPostType,
        scopeFilterEnum: _feedScopeType,
        endCursor: _endCursor,
      ),
    );
    _updateLastSeenCursorOnPagination();
    _canPaginate = false;
  }

  void _onPageChanged(int currentPageIndex) {
    if (_currentPage == currentPageIndex) {
      return;
    }
    if (currentPageIndex < 0) {
      debugPrint('-ve current pge');
      return;
    }
    if (currentPageIndex >= _posts.length) {
      debugPrint('Current page greater than list size');
      return;
    }
    _currentPage = currentPageIndex;
    _lastVisitedIndex = math.max(_lastVisitedIndex, currentPageIndex);
    if (_canPaginate && (currentPageIndex == ((_posts.length - 1) - 5))) {
      _paginate();
    }
    _setCurrentVisiblePost(_posts[currentPageIndex]);
    _feedGxC.currentIndex = currentPageIndex;
    setState(() {});
    _mainBloc.add(
      OnFeedWidgetChangedEvent(
        currentPageIndex,
        HOME_FEED_PAGE_ID,
      ),
    );
    if (mounted) setState(() {});
  }

  Widget _createWidgetFromPost(int itemIndex) {
    final Post post = _posts[itemIndex];
    return SizedBox(
      height: _mainBloc.height,
      child: PostWidget(
        post: post,
        feedGxC: _feedGxC,
        itemIndex: itemIndex,
        pageId: HOME_FEED_PAGE_ID,
        key: ValueKey('$itemIndex:${post.id}'),
      ),
    );
  }

  void _scrollListener() {
    final currentPageIndex =
        ((_scrollController.initialScrollOffset + _scrollController.offset) /
                _scrollController.position.viewportDimension)
            .round();
    _onPageChanged(currentPageIndex);
  }

  Widget _pageView() => ListView.builder(
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        controller: _scrollController,
        cacheExtent: _mainBloc.height * 3,
        itemCount: _posts.length,
        physics: const PageScrollPhysics(),
        itemBuilder: (context, index) => _createWidgetFromPost(index),
      );

  List<Widget> _noFollowingPostsMessage() => [
        WildrIcon(
          WildrIcons.search_outline,
          size: 80.0.w,
        ),
        SizedBox(height: 15.0.h),
        Text(
          _appLocalizations.feed_forAllYourFaves,
          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 10.0.h),
        Text(
          _appLocalizations.feed_oneFeedDescription,
          style: const TextStyle(
            fontSize: 13,
          ),
        ),
        SizedBox(height: 20.0.h),
        SizedBox(
          width: Get.width * 0.7,
          child: PrimaryCta(
            text: _appLocalizations.feed_startFollowing,
            filled: true,
            onPressed: () {
              context.pushRoute(
                SearchPageRoute(
                  goToIndex: USERS_PAGE_INDEX,
                ),
              );
            },
          ),
        ),
      ];

  List<Widget> _noICPostsMessage() => [
        WildrIconPng(WildrIconsPng.inner_circle, size: 80.0.w),
        SizedBox(height: 15.0.h),
        Text(
          _appLocalizations.feed_yourInnerCircle,
          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 10.0.h),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            _appLocalizations.feed_connectAndShareDescription,
            style: const TextStyle(fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ),
        SizedBox(height: 20.0.h),
        SizedBox(
          width: Get.width * 0.7,
          child: PrimaryCta(
            text: _appLocalizations.feed_getStarted,
            filled: true,
            onPressed: () {
              context.pushRoute(
                UserListsPageRoute(
                  user: Common().currentUser(context),
                  isCurrentUser: true,
                  isUserLoggedIn: true,
                  selectedUserListTypeFromPreviousPage:
                      UserListType.INNER_CIRCLE,
                ),
              );
            },
          ),
        ),
      ];

  List<Widget> _noPostsFoundMessage() => [
        WildrIcon(
          WildrIcons.image_search_filled,
          size: 80.0.w,
        ),
        Text(
          _appLocalizations.feed_noPostsYet,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ];

  List<Widget> _initialLoadingMessage() => [
        WildrIcon(
          WildrIcons.wildr_filled,
          size: 88.0.w,
          color: Get.theme.brightness == Brightness.dark
              ? Colors.white
              : WildrColors.primaryColor,
        ),
      ];

  ListView _emptyListMessage() {
    List<Widget> children = [];
    if (_showStartFollowingPage &&
        _feedScopeType == FeedScopeType.PERSONALIZED_FOLLOWING) {
      children = _noFollowingPostsMessage();
    } else if (_showICMessagePage &&
        _feedScopeType == FeedScopeType.INNER_CIRCLE_CONSUMPTION) {
      children = _noICPostsMessage();
    } else {
      if (_noPostsLeft) {
        children = _noPostsFoundMessage();
      } else {
        children = _initialLoadingMessage();
      }
    }
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        SizedBox(
          height: Get.height - _bottomPadding - _topPadding,
          child: Padding(
            padding: EdgeInsets.only(top: _bottomPadding),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: children,
            ),
          ),
        ),
      ],
    );
  }

  Widget _messageOrList() => _posts.isEmpty ? _emptyListMessage() : _pageView();

  bool? shouldScrollToTopAfterRefresh = false;

  void _onRefresh({shouldScrollToTop = false}) {
    setState(() {
      _isRefreshing = true;
      shouldScrollToTopAfterRefresh = true;
      _feedGxC.currentIndex = 0;
    });
    _canPaginate = false;
    _mainBloc
        .add(RefetchHomeFeedGqlIsolateEvent(feedScopeType: _feedScopeType));
  }

  Widget _pageViewWithRefreshIndicator() => DoubleTapToLikeWrapperWidget(
        shouldAddBlur: _shouldAddBlur,
        disable:
            _feedGxC.currentPost.id.isEmpty || _feedGxC.currentPost.isDeleted(),
        child: pull_to_refresh.SmartRefresher(
          controller: _refreshController,
          onRefresh: _onRefresh,
          onLoading: _paginate,
          header: const pull_to_refresh.MaterialClassicHeader(),
          scrollDirection: Axis.vertical,
          child: _messageOrList(),
        ),
      );

  Widget _content() => Stack(
        key: const Key(HOME_FEED_PAGE_ID),
        children: [
          _pageViewWithRefreshIndicator(),
          if (_feedGxC.currentPost.id.isNotEmpty &&
              !(_feedGxC.currentPost.willBeDeleted ?? false))
            Align(
              alignment: Alignment.bottomCenter,
              child: Common().feedGradientWidget(_feedGxC),
            ),
          if (!_viewOnlyMode &&
              !(_feedGxC.currentPost.willBeDeleted ?? false)) ...[
            Align(
              alignment: Alignment.bottomCenter,
              child:
                  PostBottomView(feedGxC: _feedGxC, pageId: HOME_FEED_PAGE_ID),
            ),
          ],
        ],
      );

  void _onFilterPosts(
    Map<String, dynamic> variables,
    FeedPostType filterEnum,
    FeedScopeType scopeFilterEnum,
  ) {
    setState(() {
      _feedPostType = filterEnum;
      _feedScopeType = scopeFilterEnum;
    });
    debugPrint('Filter enum= $_feedScopeType');
    _updateFilters();
    Prefs.setString(PrefKeys.kLastSelectedFeedType, scopeFilterEnum.name);
  }

  void _updateFilters() {
    debugPrint('Updating filters');
    _mainBloc.add(
      UpdateHomeFeedVariablesEvent(
        _feedPostType,
        _feedScopeType,
      ),
    );
    _addBlur();
  }

  Widget _topView() => Obx(
        () => Column(
          children: [
            FeedPageTopView(
              feedGxC: _feedGxC,
              feedPostType: _feedPostType,
              feedScopeType: _feedScopeType,
              onFilterPosts: _onFilterPosts,
              viewOnlyMode: _viewOnlyMode,
            ),
            ...Common().dotIndicatorAndParentChallenge(
              _feedGxC,
              context: context,
            ),
          ],
        ),
      );

  AppBar _appBar() => AppBar(
        systemOverlayStyle: Theme.of(context).brightness == Brightness.dark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        shadowColor: Colors.transparent,
        backgroundColor: Colors.transparent,
        toolbarHeight: kToolbarHeight + 30 + 30,
        title: _topView(),
      );

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: _appBar(),
      body: BlocConsumer<MainBloc, MainState>(
        listener: _blocListener,
        builder: (context, state) => _content(),
      ),
    );
  }

  //Helpers

  void _addBlur() {
    print('addBlur');
    setState(() {
      _shouldAddBlur = true;
    });
  }

  void _removeBlur() {
    _shouldAddBlur = false;
    if (mounted) setState(() {});
  }

  void _scrollToTheTop({animate = true}) {
    if (_posts.isNotEmpty) {
      if (_scrollController.hasClients) {
        _scrollController
            .animateTo(
              0,
              duration: Duration(milliseconds: animate ? 800 : 1),
              curve: Curves.easeOut,
            )
            .then((value) => _feedGxC.currentIndex = 0);
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}
