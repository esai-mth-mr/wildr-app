import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart' as pull_to_refresh;
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_state.dart';
import 'package:wildr_flutter/post_feed/posts_feed_page_body.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

void print(dynamic message) {
  debugPrint('ExploreFeed: $message');
}

class PostsFeedPage extends StatefulWidget {
  final MainBloc mainBloc;
  final FeedGxC feedGxC;
  final bool canPaginate;
  final Function onRefresh;
  final Function paginate;
  final String heroTag;
  final String pageId;

  const PostsFeedPage({
    required this.mainBloc,
    required this.feedGxC,
    required this.canPaginate,
    required this.onRefresh,
    required this.paginate,
    required this.heroTag,
    required this.pageId,
    super.key,
  });

  @override
  State<PostsFeedPage> createState() => _PostsFeedPageState();
}

class _PostsFeedPageState extends State<PostsFeedPage> {
  late final FeedGxC _feedGxC = widget.feedGxC;
  late final _pageId = widget.pageId;
  late final PageController _pageController =
      PageController(initialPage: _feedGxC.currentIndex);
  late final double _heightOfEachPost = Get.height;
  late final double _bottomPadding =
      (Get.bottomBarHeight == 0) ? (Get.height * 0.12) : (Get.height * 0.14);
  late final double _topPadding = MediaQuery.of(context).padding.top + 60.0.h;

  List<Post> get _posts => _feedGxC.posts;
  late final pull_to_refresh.RefreshController _refreshController =
      pull_to_refresh.RefreshController();
  late bool _canPaginate = widget.canPaginate;
  late int _currentPage = _feedGxC.currentIndex;
  bool shouldAddBottomView = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        setState(() {
          shouldAddBottomView = true;
        });
      }
    });
  }

  void _onRefresh() {
    widget.onRefresh();
  }

  void _paginatePosts() {
    if (!_canPaginate) {
      _refreshController.loadComplete();
      return;
    }
    print('Paginating!');
    widget.paginate();
  }

  void _onPageChanged(int currentPageIndex) {
    if (_currentPage == currentPageIndex) return;
    if (currentPageIndex < 0) return;
    if (currentPageIndex >= _posts.length) return;
    _currentPage = currentPageIndex;
    _feedGxC.isCaptionExpanded.value = false;
    _feedGxC
      ..currentIndex = currentPageIndex
      ..updateCurrentVisiblePost();
    final int postsLength = _posts.length;
    if (currentPageIndex == (postsLength - 3)) _paginatePosts();
    setState(() {});
    widget.mainBloc.add(
      OnFeedWidgetChangedEvent(
        currentPageIndex,
        _pageId,
      ),
    );
  }

  Widget _scaffoldBody() {
    print('count = ${_posts.length}');
    return PostsFeedPageBody(
      feedGxC: widget.feedGxC,
      pageId: _pageId,
      onBackPressed: () {
        setState(() {
          shouldAddBottomView = false;
        });
        Navigator.of(context).pop();
      },
      shouldAddBottomView: shouldAddBottomView,
      key: ValueKey(_pageId),
      smartRefreshController: _refreshController,
      onRefresh: _onRefresh,
      paginatePosts: _paginatePosts,
      posts: _posts,
      bodyHeight: widget.mainBloc.height,
      pageController: _pageController,
      onPageChanged: _onPageChanged,
      pageViewBottomPadding: _bottomPadding,
      topPadding: _topPadding,
      feedBottomViewBottomPadding: MediaQuery.of(context).padding.bottom,
      heightOfEachPost: _heightOfEachPost - _topPadding,
    );
  }

  void _onExploreFeedUpdate(ExploreFeedUpdateState state) {
    _refreshController
      ..refreshCompleted()
      ..loadComplete();
    setState(() {});
  }

  void _onUserPageFeedUpdate(UserPageFeedUpdateState state) {
    _canPaginate = !state.hasReachedEndOfTheList;
    _refreshController
      ..refreshCompleted()
      ..loadComplete();
    setState(() {});
  }

  Future<void> _onCurrentUserPaginatedPostsState(
    CurrentUserPaginatedPostsState state,
  ) async {
    if (_pageId != CURRENT_USER_FEED_PAGE_ID) {
      print('pageId is not CURRENT_USER_FEED_PAGE_ID');
      return;
    }
    _canPaginate = !state.hasReachedEndOfTheList;
    _refreshController.loadComplete();
    if (mounted) {
      setState(() {});
    }
  }

  BlocListener<MainBloc, MainState> _mainBlocListener() =>
      BlocListener<MainBloc, MainState>(
        bloc: Common().mainBloc(context),
        listener: (context, state) {
          if (state is AuthenticationSuccessfulState) {
            // TODO WHY?
            if (_pageId == CURRENT_USER_FEED_PAGE_ID) {
              Navigator.pop(context);
            }
          } else if (state is DeletePostState) {
            print('DeletePostState ${state.isSuccessful}');
            if (state.isSuccessful) {
              context.loaderOverlay.hide();
              Navigator.pop(context);
            } else {
              context.loaderOverlay.hide();
              Common().showErrorSnackBar(kSomethingWentWrong, context);
            }
          } else if (state is ExploreFeedUpdateState) {
            _onExploreFeedUpdate(state);
          } else if (state is CanPaginateExploreFeedState) {
            print('CanPaginateExploreFeedState = ${state.canPaginate}');
            _canPaginate = state.canPaginate;
          } else if (state is CurrentUserPaginatedPostsState) {
            _onCurrentUserPaginatedPostsState(state);
          } else if (state is UserPageFeedUpdateState) {
            if (state.pageId == _pageId) {
              _onUserPageFeedUpdate(state);
            }
          } else if (state is PaginateChallengeConnectionState) {
            if (_feedGxC.challengeId == state.challengeId) {
              _refreshController
                ..refreshCompleted()
                ..loadComplete();
              setState(() {});
            }
          }
        },
      );

  List<BlocListener> _blocListeners() => [_mainBlocListener()];

  @override
  Widget build(BuildContext context) => MultiBlocListener(
        listeners: _blocListeners(),
        child: _scaffoldBody(),
      );

  @override
  void dispose() {
    shouldAddBottomView = false;
    Get.delete(tag: _pageId);
    super.dispose();
  }
}
