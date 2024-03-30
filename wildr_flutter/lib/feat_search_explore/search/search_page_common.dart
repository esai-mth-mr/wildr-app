import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tile.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class SearchPageCommon {
  static TextStyle get titleTextStyle =>
      TextStyle(fontWeight: FontWeight.w700, fontSize: 13.0.sp);

  static TextStyle get subtitleStyle =>
      TextStyle(fontWeight: FontWeight.w700, fontSize: 11.0.sp);

  static Widget postTile(
    Post post,
    BuildContext context, {
    bool shouldRenderRichText = false,
    bool shouldEnableRepostTag = false,
  }) =>
      PostTile(
        post,
        shouldRenderRichText: shouldRenderRichText,
        performantClip: false,
        shouldEnableRepostTag: shouldEnableRepostTag,
        shouldShowWarningDescription: false,
        onTap: () {
          context.pushRoute(
            SinglePostPageRoute(
              postId: post.id,
            ),
          );
        },
      );
}
