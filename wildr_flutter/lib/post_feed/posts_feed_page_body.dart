import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart' as pull_to_refresh;
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_bottom_view.dart';
import 'package:wildr_flutter/post_feed/posts_feed_page_view.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/double_tap_to_like_wrapper.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';

class PostsFeedPageBody extends StatelessWidget {
  final VoidCallback? onBackPressed;
  final FeedGxC feedGxC;
  final String pageId;
  final bool shouldAddBottomView;
  final double feedBottomViewBottomPadding;
  final double pageViewBottomPadding;
  final double topPadding;
  final pull_to_refresh.RefreshController smartRefreshController;
  final VoidCallback? onRefresh;
  final VoidCallback? paginatePosts;
  final List<Post> posts;
  final double bodyHeight;
  final PageController pageController;
  final Function(int) onPageChanged;
  final double heightOfEachPost;

  const PostsFeedPageBody({
    super.key,
    required this.onBackPressed,
    required this.feedGxC,
    required this.pageId,
    required this.shouldAddBottomView,
    required this.smartRefreshController,
    required this.onRefresh,
    required this.paginatePosts,
    required this.feedBottomViewBottomPadding,
    required this.pageViewBottomPadding,
    required this.posts,
    required this.bodyHeight,
    required this.pageController,
    required this.onPageChanged,
    required this.topPadding,
    required this.heightOfEachPost,
  });

  Widget _postsFeedPageView() => PostsFeedPageView(
      posts: posts,
      bottomPadding: pageViewBottomPadding,
      topPadding: topPadding,
      feedGxC: feedGxC,
      pageId: pageId,
      heightOfEachPost: heightOfEachPost,
      onPageChanged: onPageChanged,
      pageController: pageController,
    );

  Widget _smartRefresher() => pull_to_refresh.SmartRefresher(
      physics: const PageScrollPhysics(),
      enablePullUp: true,
      controller: smartRefreshController,
      onRefresh: () {
        debugPrint('${onRefresh == null}');
        if (onRefresh != null) onRefresh!.call();
      },
      onLoading: paginatePosts,
      header: const pull_to_refresh.MaterialClassicHeader(),
      footer: createEmptyPaginationFooter(),
      child: _postsFeedPageView(),
    );

  Widget _feed(context) => Stack(
      children: [
        _smartRefresher(),
        Align(
          alignment: Alignment.bottomCenter,
          child: Common().feedGradientWidget(feedGxC),
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(
              right: 5.0.w,
              left: 5.0.w,
              bottom: 5.0.w,
            ),
            child: PostBottomView(
              key: key,
              feedGxC: feedGxC,
              bottomPadding: feedBottomViewBottomPadding,
              shouldNavigateToCurrentUser: false,
              pageId: pageId,
            ),
          ),
        ),
        Align(
          alignment: Alignment.topCenter,
          child: Obx(
            () => Container(
              margin: const EdgeInsets.only(top: 10),
              height: 30,
              child: Common().parentChallengeOnPost(feedGxC, context),
            ),
          ),
        ),
      ],
    );

  Widget _body(context) => DoubleTapToLikeWrapperWidget(child: _feed(context));

  Widget _topView(BuildContext context) => Obx(
      () => Padding(
        padding: const EdgeInsets.only(right: 56.0),
        child: Common().feedDotIndicator(feedGxC),
      ),
    );

  AppBar _appBar(BuildContext context) => AppBar(
      systemOverlayStyle: SystemUiOverlayStyle.light,
      shadowColor: Colors.transparent,
      backgroundColor: Colors.transparent,
      iconTheme: const IconThemeData(color: Colors.white),
      centerTitle: true,
      title: _topView(context),
    );

  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: Colors.black,
      appBar: _appBar(context),
      body: _body(context),
    );
}
