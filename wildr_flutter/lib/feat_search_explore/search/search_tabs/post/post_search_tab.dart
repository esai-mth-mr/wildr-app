// ignore_for_file: lines_longer_than_80_chars

import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tiles_sliver_grid.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page_common.dart';
import 'package:wildr_flutter/forked_packages/flutter_staggered_grid_view-0.4.1/widgets/staggered_grid_view.dart';
import 'package:wildr_flutter/forked_packages/flutter_staggered_grid_view-0.4.1/widgets/staggered_tile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';

void print(dynamic message) {
  debugPrint('[PostSearchTab] $message ');
}

class PostSearchTab extends StatefulWidget {
  final String? pageId;

  const PostSearchTab({this.pageId, super.key});

  @override
  PostSearchTabState createState() => PostSearchTabState();
}

class PostSearchTabState extends State<PostSearchTab>
    with AutomaticKeepAliveClientMixin {
  PostsSearchResultState _state =
      PostsSearchResultState(isLoading: true, query: '');
  bool? _didSwitchFirstTime;
  bool _shouldShowShimmer = true;
  bool _canPaginate = true;
  String _endCursor = '';
  late final RefreshController _refreshController = RefreshController();
  late final MainBloc _mainBloc = Common().mainBloc(context);
  late final _exploreFeedGxC = Get.put(FeedGxC(), tag: EXPLORE_FEED_PAGE_ID);
  late ScrollController _scrollController;

  List<Post> get _exploreFeedPosts => _exploreFeedGxC.posts;
  final bool _shouldDisplayExploreFeed = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _mainBloc.add(PostsSearchEvent(''));
  }

  Widget _searchResults() {
    if (_state.errorMessage != null) {
      return Container(
        padding: EdgeInsets.only(bottom: Get.height * 0.2),
        child: Center(child: Text(_state.errorMessage!)),
      );
    }
    return StaggeredGridView.countBuilder(
      crossAxisCount: 2,
      mainAxisSpacing: 5,
      crossAxisSpacing: 5,
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 5),
      itemCount: _itemCount,
      staggeredTileBuilder: (index) =>
          StaggeredTile.count(1, ((index + 2) % 3 == 0) ? 1.5 : 1.3),
      itemBuilder: (context, index) {
        if (_state.isLoading || _state.results == null) {
          return Common().clipIt(
            child: Common().wrapInShimmer(Container(color: Colors.white)),
          );
        }
        if (index >= _itemCount) {
          return Container();
        }
        final post = _state.results![index];
        return SearchPageCommon.postTile(
          post,
          context,
          shouldEnableRepostTag: true,
        );
      },
    );
  }

  Post _getPostAtIndex(int index) {
    final safeIndex = min(index, max(0, _exploreFeedPosts.length - 1));
    return _exploreFeedPosts[safeIndex];
  }

  void _updateLastSeenCursor(int index, {bool isRefresh = false}) {
    print('_updateLastSeenCursor');
    _mainBloc.add(
      UpdateExploreFeedLastSeenCursorEvent(
        endCursor: _getPostAtIndex(index).id,
        feedType: FeedPostType.ALL,
        scopeType: FeedScopeType.PERSONALIZED,
        isRefresh: isRefresh,
      ),
    );
  }

  void _onRefresh() {
    print('onRefresh()');
    _mainBloc.add(RefetchExploreFeedEvent());
    _canPaginate = true;
  }

  void _onPostTap(String heroTag, bool shouldPopLater) {
    _updateLastSeenCursor(_exploreFeedGxC.currentIndex);
    context
        .pushRoute(
      PostsFeedPageRoute(
        canPaginate: _canPaginate,
        mainBloc: _mainBloc,
        feedGxC: _exploreFeedGxC,
        onRefresh: _onRefresh,
        paginate: _paginatePosts,
        heroTag: heroTag,
        pageId: EXPLORE_FEED_PAGE_ID,
      ),
    )
        .then(
      (value) {
        if (shouldPopLater) {
          Navigator.of(context).pop();
        }
      },
    );
  }

  void _paginatePosts() {
    if (!_canPaginate) {
      print('Done with pagination');
      _refreshController.loadNoData();
      return;
    }
    if (_endCursor.isNotEmpty) {
      _mainBloc.add(
        PaginateExploreFeedEvent(endCursor: _endCursor),
      );
    } else {
      _refreshController.loadNoData();
    }
  }

  Widget _postsList() => PostTilesSliverGrid(
        userPosts: _shouldShowShimmer ? null : _exploreFeedPosts,
        feedGxC: _exploreFeedGxC,
        onTap: _onPostTap,
        onPagination: _paginatePosts,
        context: context,
        pageId: widget.pageId ?? 'posts_search',
      );

  Widget _tiledExploreFeed() => CustomScrollView(
        controller: _scrollController,
        slivers: [
          _postsList(),
        ],
      );

  Widget _exploreFeedSmartRefresher() => Padding(
        padding: EdgeInsets.only(
          top: 10,
          bottom: MediaQuery.of(context).padding.bottom,
        ),
        child: SmartRefresher(
          key: const ValueKey(EXPLORE_FEED_PAGE_ID),
          controller: _refreshController,
          onRefresh: _onRefresh,
          onLoading: _paginatePosts,
          enablePullUp: true,
          footer: createEmptyPaginationFooter(),
          child: _tiledExploreFeed(),
        ),
      );

  Widget _body() {
    if (!_shouldDisplayExploreFeed) return _searchResults();
    final List<Widget> children = [
      _exploreFeedSmartRefresher(),
      _searchResults(),
    ];
    int index = 0;
    if (_state.query.isNotEmpty) {
      if ((_state.results?.isNotEmpty ?? false) || _state.isLoading) {
        index = 1;
      }
    }
    print('index = $index');
    return IndexedStack(
      index: index,
      children: children,
    );
  }

  void _updateCurrentVisiblePost() {
    if (_exploreFeedPosts.isEmpty) return;
    _exploreFeedGxC.updateCurrentVisiblePost();
  }

  void _onExploreFeedUpdate(ExploreFeedUpdateState state) {
    if (!state.isSuccessful) {
      _refreshController
        ..loadFailed()
        ..refreshFailed();
      Common().showSnackBar(
        context,
        state.errorMessage,
        isDisplayingError: true,
      );
      return;
    }
    _shouldShowShimmer = false;
    print('Setting = ${state.endCursor}');
    _endCursor = state.endCursor;
    _refreshController
      ..refreshCompleted()
      ..loadComplete();
    if (_endCursor.isEmpty) {
      _refreshController.loadNoData();
    }
    _updateCurrentVisiblePost();
    _exploreFeedGxC.posts = state.posts;
    print('_canPaginate $_canPaginate');
    if (mounted) {
      setState(() {});
    }
    if (_didSwitchFirstTime == false) {
      _updateLastSeenCursor(3);
    }
  }

  void _scrollToTheTop({animate = true}) {
    if (_exploreFeedPosts.isNotEmpty) {
      if (_scrollController.hasClients) {
        _scrollController
            .animateTo(
              0,
              duration: Duration(milliseconds: animate ? 300 : 1),
              curve: Curves.easeOut,
            )
            .then((value) => _exploreFeedGxC.currentIndex = 0);
      }
    }
  }

  void _onSwitchedToThisTab() {
    if (_didSwitchFirstTime == null) {
      _didSwitchFirstTime = false;
      _mainBloc.add(PostsSearchEvent(''));
      if (!_shouldDisplayExploreFeed) return;
      if (_exploreFeedPosts.isNotEmpty) {
        _updateLastSeenCursor(3);
      }
    }
  }

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is PostsSearchResultState &&
        widget.pageId == state.singlePageId) {
      setState(() {
        _state = state;
      });
      if (!state.isLoading) {
        if (state.errorMessage != null || _state.results == null) {
          Common().showSnackBar(
            context,
            state.errorMessage ?? kSomethingWentWrong,
            isDisplayingError: true,
          );
        }
      }
    } else if (state is SwitchedToSearchTabState) {
      _onSwitchedToThisTab();
    } else if (state is DeletePostState) {
      if (state.isSuccessful) {
        context.loaderOverlay.hide();
      } else {
        context.loaderOverlay.hide();
        Common().showSnackBar(
          context,
          kSomethingWentWrong,
          isDisplayingError: true,
        );
      }
    } else if (state is ExploreFeedUpdateState) {
      _onExploreFeedUpdate(state);
    } else if (state is CanPaginateExploreFeedState) {
      print('CanPaginateExploreFeedState ${state.canPaginate}');
      _canPaginate = state.canPaginate;
    } else if (state is OnFeedWidgetChangedEvent) {
      setState(() {});
    } else if (state is ScrollToTheTopOfExploreFeedState) {
      _scrollToTheTop();
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: _mainBlocListener,
      child: _body(),
    );
  }

  int get _itemCount {
    if (_state.results == null) {
      return 10;
    } else {
      return _state.results!.length;
    }
  }

  @override
  bool get wantKeepAlive => true;
}
