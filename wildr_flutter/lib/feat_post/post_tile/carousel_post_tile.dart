import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_tile/carousel_post_icon.dart';
import 'package:wildr_flutter/feat_post/post_tile/image_post_tile.dart';
import 'package:wildr_flutter/feat_post/post_tile/text_post_tile_card.dart';
import 'package:wildr_flutter/feat_post/post_tile/video_post_tile.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CarouselPostTileCard extends StatelessWidget {
  final Post post;
  final bool shouldRenderRichText;
  final int? maxLines;
  final double? maxFontSize;
  final bool isDense;
  final bool shouldShowCarouselIcon;

  const CarouselPostTileCard(
    this.post, {
    this.shouldRenderRichText = true,
    this.maxLines,
    this.maxFontSize,
    this.isDense = false,
    this.shouldShowCarouselIcon = true,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    if (post.subPosts != null && post.subPosts!.isNotEmpty) {
      final SubPost firstSubPost = post.subPosts!.first;
      Widget child;
      if (firstSubPost.type == 1) {
        child = TextPostTileCard(
          post: firstSubPost,
          shouldRenderRichText: shouldRenderRichText,
          maxFontSize: maxFontSize,
          maxLines: maxLines,
        );
      } else if (firstSubPost.type == 2) {
        child = ImagePostTileCard(firstSubPost);
      } else if (firstSubPost.type == 3) {
        child = VideoPostTileCard(firstSubPost);
      } else {
        child = Container();
      }
      return ColoredBox(
        color: WildrColors.bannerOrTileBgColor(context),
        child: (post.subPosts!.length > 1)
            ? Stack(
                children: [
                  child,
                  if (shouldShowCarouselIcon) CarouselIcon(isDense: isDense),
                ],
              )
            : child,
      );
    } else {
      // print("❌ SubPosts null");
      return Container();
    }
  }
}
