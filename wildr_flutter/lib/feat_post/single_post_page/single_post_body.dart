import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_bottom_view.dart';
import 'package:wildr_flutter/feat_post/post_video_body.dart';
import 'package:wildr_flutter/feat_post/post_widget.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_gxc.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/double_tap_to_like_wrapper.dart';

class SinglePostPageBody extends StatelessWidget {
  final SinglePostGxC postGxC;
  final double topPadding;
  final int? initialPageIndex;
  final bool shouldAddBottomView;
  final bool shouldEnableDoubleTapToLike;
  final BuildContext context;
  final bool shouldShowFab;

  const SinglePostPageBody({
    required this.postGxC,
    required this.topPadding,
    required this.shouldAddBottomView,
    this.initialPageIndex,
    this.shouldEnableDoubleTapToLike = true,
    this.shouldShowFab = true,
    required this.context,
    super.key,
  });

  Widget _postBody() {
    final Post post = postGxC.currentPost;
    if (post.type == 1) {
      return Padding(
        padding: EdgeInsets.only(
          left: 10,
          right: 10,
          top: topPadding,
        ),
        child: ColoredBox(
          color: Theme.of(context).colorScheme.background,
          child: Center(
            child: InkWell(
              onTap: () {},
              splashColor: Colors.red,
              //highlightColor: AppColor.primarySwatches[400]!,
              highlightColor: Colors.red,
              child: SmartTextCommon().getAutoResizeTextForFeed(post, context),
            ),
          ),
        ),
      );
    } else if (post.type == 2) {
      return Container(
        // key: ValueKey(post.hashCode),
        key: PageStorageKey(
          'keyData${post.mediaPath}',
        ),
        child: PostImageBody(
          post.mediaPath,
          fallbackImageUrl: post.thumbnail,
        ),
      );
    } else if (post.type == 3) {
      return Container(
        key: PageStorageKey(
          'keyData${post.mediaPath}',
        ),
        child: PostVideoBody(
          feedGxC: postGxC,
          parentIndex: 0,
          url: post.mediaPath,
          pageId: SINGLE_POST_PAGE_ID + post.id,
        ),
      );
    } else if (post.type == 4) {
      return SizedBox(
        width: Get.width,
        child: PostWidget(
          post: post,
          feedGxC: postGxC,
          itemIndex: 0,
          canTriggerVideoLoader: false,
          pageId: SINGLE_POST_PAGE_ID + post.id,
          textPostPadding:
              Common().textPostPadding(context, addToBottom: 70.0.h),
          initialPageIndex: initialPageIndex,
          shouldNavigateToCurrentUserTab: false,
        ),
      );
    } else {
      return Text(AppLocalizations.of(context)!.post_thisIsPost);
    }
  }

  Widget _post() => Stack(
        children: [
          Center(child: _postBody()),
          Align(
            alignment: Alignment.bottomCenter,
            child: Common().postGradientWidget(postGxC),
          ),
          if (shouldAddBottomView)
            Align(
              alignment: Alignment.bottomCenter,
              child: PostBottomView(
                pageId: SINGLE_POST_PAGE_ID + postGxC.currentPost.id,
                key: ValueKey(postGxC.currentPost.id),
                feedGxC: postGxC,
                shouldNavigateToCurrentUser: false,
                bottomPadding: max(
                  0,
                  MediaQuery.of(context).padding.bottom,
                ),
                shouldShowFab: shouldShowFab,
              ),
            ),
          Align(
            alignment: Alignment.topCenter,
            child: Obx(
              () => Container(
                margin: const EdgeInsets.only(top: 10),
                height: 30,
                child: Common().parentChallengeOnPost(postGxC, context),
              ),
            ),
          ),
        ],
      );

  Widget _content() {
    if (postGxC.currentPost.id.isEmpty) {
      return Container(
        margin: EdgeInsets.only(bottom: topPadding),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    final Widget postBody = shouldEnableDoubleTapToLike
        ? DoubleTapToLikeWrapperWidget(child: _post())
        : _post();
    return VisibilityDetector(
      key: Key(postGxC.currentPost.id),
      onVisibilityChanged: (info) {
        final visiblePercentage = info.visibleFraction * 100;
        postGxC.isPaused = visiblePercentage == 0;
      },
      child: Container(
        height: Common().mainBloc(context).height,
        color: Colors.black,
        child: postBody,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => _content();
}
