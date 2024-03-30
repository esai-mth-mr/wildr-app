import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_video_body.dart';
import 'package:wildr_flutter/feat_post/post_widget.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class PostsFeedWidget extends StatelessWidget {
  final double bottomPadding;
  final double topPadding;
  final FeedGxC feedGxC;
  final String pageId;
  final Post post;
  final int itemIndex;

  const PostsFeedWidget({
    required this.bottomPadding,
    required this.topPadding,
    required this.feedGxC,
    required this.pageId,
    required this.post,
    required this.itemIndex,
    super.key,
  });

  Widget _textPost(BuildContext context) => Padding(
        padding: EdgeInsets.only(
          left: 10,
          right: 10,
          bottom: bottomPadding,
          top: topPadding,
        ),
        child: ColoredBox(
          color: Get.theme.colorScheme.background,
          child: Center(
            child: InkWell(
              onTap: () {},
              splashColor: Colors.red,
              highlightColor: Colors.red,
              onLongPress: () {
                Clipboard.setData(ClipboardData(text: post.bodyText ?? '-'));
                Common().showSnackBar(
                  context,
                  AppLocalizations.of(context)!.post_feed_postCopiedToClipboard,
                );
              },
              child: SmartTextCommon().getAutoResizeTextForFeed(post, context),
            ),
          ),
        ),
      );

  Widget _imagePost() => Container(
        key: PageStorageKey(
          'keyData${post.mediaPath}',
        ),
        child: PostImageBody(
          post.mediaPath,
          fallbackImageUrl: post.thumbnail,
        ),
      );

  Widget _videoPost() => Container(
        key: PageStorageKey(
          'keyData${post.mediaPath}',
        ),
        child: PostVideoBody(
          feedGxC: feedGxC,
          parentIndex: itemIndex,
          url: post.mediaPath,
          pageId: pageId,
        ),
      );

  Widget _carouselPost(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      height: size.height,
      child: PostWidget(
        post: post,
        feedGxC: feedGxC,
        itemIndex: itemIndex,
        canTriggerVideoLoader: false,
        pageId: pageId,
        textPostPadding: Common().textPostPadding(context, addToBottom: 70.0.h),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    switch (post.type) {
      case 1:
        return _textPost(context);
      case 2:
        return _imagePost();
      case 3:
        return _videoPost();
      case 4:
        return _carouselPost(context);
      default:
        return const Text('??');
    }
  }
}
