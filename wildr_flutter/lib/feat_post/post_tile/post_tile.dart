import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_type.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_wrapper.dart';
import 'package:wildr_flutter/feat_post/post_tile/carousel_post_tile.dart';
import 'package:wildr_flutter/feat_post/post_tile/deleted_parent_repost.dart';
import 'package:wildr_flutter/feat_post/post_tile/image_post_tile.dart';
import 'package:wildr_flutter/feat_post/post_tile/text_post_tile_card.dart';
import 'package:wildr_flutter/feat_post/post_tile/video_post_tile.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/post_tag_tile.dart';

class PostTile extends StatelessWidget {
  final Post post;
  final bool shouldRenderRichText;
  final void Function()? onTap;
  final int? maxLines;
  final double? maxFontSize;
  final bool isDense;
  final bool shouldShowCarouselIcon;
  final bool performantClip;
  final double clipRadius;
  final bool shouldClip;
  final bool shouldEnableRepostTag;
  final double? titleFontSize;
  final double? iconSize;
  final bool? shouldShowWarningDescription;

  const PostTile(
    this.post, {
    super.key,
    this.shouldRenderRichText = false,
    this.onTap,
    this.maxLines,
    this.maxFontSize,
    this.isDense = false,
    this.shouldShowCarouselIcon = true,
    this.performantClip = true,
    this.clipRadius = 15,
    this.shouldClip = true,
    this.shouldEnableRepostTag = false,
    this.titleFontSize,
    this.shouldShowWarningDescription,
    this.iconSize,
  });

  @override
  Widget build(BuildContext context) {
    Widget widget = post.overlay == PostOverlayType.NONE
        ? _post()
        : PostOverlayWrapper(
            post: post,
            iconSize: iconSize ?? (isDense ? 10 : Get.width * 0.1),
            titleFontSize: titleFontSize ?? (isDense ? 8 : 12.0.sp),
            shouldShowWarningDescription: shouldShowWarningDescription ?? false,
            isDense: true,
            child: _post(),
          );
    if (shouldEnableRepostTag) {
      widget = post.isRepost()
          ? Stack(
              children: [
                widget,
                const Align(
                  alignment: Alignment.bottomLeft,
                  child: RepostTagTile(),
                ),
              ],
            )
          : widget;
    }

    if (shouldClip) {
      widget = Common().clipIt(
        child: widget,
        radius: clipRadius,
        performant: performantClip,
      );
    }
    if (onTap == null) {
      return widget;
    }
    return GestureDetector(
      onTap: onTap,
      child: widget,
    );
  }

  Widget _post() {
    if (post.isParentPostDeleted()) {
      return const DeletedParentRepost();
    }
    if (post.type == 1) {
      return TextPostTileCard(
        post: post,
        shouldRenderRichText: shouldRenderRichText,
        maxFontSize: maxFontSize,
        maxLines: maxLines,
      );
    } else if (post.type == 2) {
      return ImagePostTileCard(post);
    } else if (post.type == 3) {
      return VideoPostTileCard(post); //Video
    } else if (post.type == 4) {
      return CarouselPostTileCard(
        post,
        shouldRenderRichText: shouldRenderRichText,
        maxFontSize: maxFontSize,
        maxLines: maxLines,
        isDense: isDense,
        shouldShowCarouselIcon: shouldShowCarouselIcon,
      );
    }
    return Container();
  }
}
