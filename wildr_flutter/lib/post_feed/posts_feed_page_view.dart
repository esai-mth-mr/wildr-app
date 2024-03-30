import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/post_feed/posts_feed_widget.dart';

class PostsFeedPageView extends StatelessWidget {
  final double bottomPadding;
  final double topPadding;
  final FeedGxC feedGxC;
  final String pageId;
  final PageController pageController;
  final Function(int)? onPageChanged;
  final List<Post> posts;
  final double heightOfEachPost;

  const PostsFeedPageView({
    required this.bottomPadding,
    required this.topPadding,
    required this.feedGxC,
    required this.pageId,
    required this.pageController,
    required this.onPageChanged,
    required this.posts,
    required this.heightOfEachPost,
    super.key,
  });

  @override
  Widget build(BuildContext context) => PageView.builder(
      controller: pageController,
      scrollDirection: Axis.vertical,
      onPageChanged: onPageChanged,
      allowImplicitScrolling: true,
      physics: const PageScrollPhysics(),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final Post post = posts[index];
        return Container(
          height: heightOfEachPost,
          color: Theme.of(context).colorScheme.background,
          child: PostsFeedWidget(
            key: ValueKey(post.id),
            post: post,
            itemIndex: index,
            bottomPadding: bottomPadding,
            topPadding: topPadding,
            feedGxC: feedGxC,
            pageId: pageId,
          ),
        );
      },
    );
}
