import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/dialogs/popup_dialog.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tile.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class PostTilesSliverGrid extends StatelessWidget {
  final List<Post>? userPosts;
  final FeedGxC feedGxC;
  final Function onTap;
  final Function onPagination;
  final BuildContext context;
  final String pageId;
  final int childCount;

  const PostTilesSliverGrid({
    super.key,
    required this.userPosts,
    required this.feedGxC,
    required this.onTap,
    required this.onPagination,
    required this.context,
    required this.pageId,
  }) : childCount = userPosts == null ? 6 : (userPosts.length);

  Widget _noPostsIconAndText() => SliverToBoxAdapter(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const WildrIcon(
              WildrIcons.image_search_outline,
              size: 80,
              color: Colors.grey,
            ),
            Text(
              AppLocalizations.of(context)!.feed_noPostsYet,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );

  Widget _shimmerTile() => Common().clipIt(
        radius: 15,
        child: Common().wrapInShimmer(Container(color: Colors.white)),
      );

  PopupDialog _popupDialog(int index) {
    final Post post = userPosts?[index] ?? Post.empty();
    return PopupDialog(
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: GestureDetector(
          onTap: () => _onPostTap(index, index.toString(), true),
          onVerticalDragUpdate: (dragUpdateDetails) {
            const int sensitivity = 10;
            if (dragUpdateDetails.delta.dy > sensitivity ||
                dragUpdateDetails.delta.dy < -sensitivity) {
              Navigator.of(context).pop();
            }
          },
          child: SizedBox(
            height: Common().mainBloc(context).height * .8,
            child: Hero(
              tag: index.toString(),
              child: PostTile(post, shouldRenderRichText: true),
            ),
          ),
        ),
      ),
    );
  }

  void _onLongPress(int index) {
    Navigator.of(context).push(_popupDialog(index));
  }

  void _onPostTap(int index, String heroTag, bool shouldPopLater) {
    feedGxC.currentIndex = index;
    // ignore: cascade_invocations
    feedGxC.updateCurrentVisiblePost();
    onTap(heroTag, shouldPopLater);
  }

  Widget _postTile(int index) {
    final Post post = userPosts?[index] ?? Post.empty();
    final heroTag = '$pageId-$index';
    return Common().clipIt(
      radius: 5,
      child: GestureDetector(
        onTap: () => _onPostTap(index, heroTag, false),
        onLongPress: () {
          _onLongPress(index);
        },
        child: Hero(
          tag: heroTag,
          child: PostTile(
            post,
            shouldEnableRepostTag: true,
          ),
        ),
      ),
    );
  }

  Widget _itemBuilder({
    required BuildContext context,
    required int index,
    required List<Post>? userPosts,
    required FeedGxC feedGxC,
    required Function onTap,
    required String pageId,
  }) {
    if (userPosts == null) {
      if (!Common().mainBloc(context).isConnected) return Container();
      return _shimmerTile();
    } else {
      if (index != 0 && index == (userPosts.length - 5)) {
        onPagination();
      }
      return _postTile(index);
    }
  }

  Widget _posts() => SliverPadding(
        padding: EdgeInsets.only(
          left: 5,
          right: 5,
          bottom: 25.0.r, //size of createPostButton
        ),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            mainAxisSpacing: 12,
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            childAspectRatio: 0.8,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) => _itemBuilder(
              context: context,
              index: index,
              userPosts: userPosts,
              feedGxC: feedGxC,
              onTap: onTap,
              pageId: pageId,
            ),
            childCount: childCount,
          ),
        ),
      );

  Widget _body() {
    if (childCount == 0) return _noPostsIconAndText();
    return _posts();
  }

  @override
  Widget build(BuildContext context) => _body();
}
