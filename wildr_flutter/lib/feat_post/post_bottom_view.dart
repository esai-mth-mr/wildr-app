import 'dart:math' as math;
import 'dart:ui';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_hamburger_menu.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';
import 'package:wildr_flutter/widgets/text/expandable_text.dart';

/// Contains
/// 1. (Left) Author's avatar
/// 2. (Left) Author's handle
/// 3. (Center) Caption
/// 4. (Right) [PostHamburgerMenu]
class PostBottomView extends StatefulWidget {
  final FeedGxC feedGxC;
  final bool shouldShowAuthorAvatar;
  final bool shouldNavigateToCurrentUser;
  final bool shouldShowHandle;
  final double? bottomPadding;
  final bool shouldKeepTextColorWhite;
  final bool shouldShowFab;
  final String pageId;

  const PostBottomView({
    super.key,
    required this.feedGxC,
    required this.pageId,
    this.bottomPadding,
    this.shouldShowAuthorAvatar = true,
    this.shouldNavigateToCurrentUser = true,
    this.shouldShowHandle = true,
    this.shouldKeepTextColorWhite = false,
    this.shouldShowFab = true,
  });

  @override
  PostBottomViewState createState() => PostBottomViewState();
}

class PostBottomViewState extends State<PostBottomView> {
  late final FeedGxC feedGxC = widget.feedGxC;

  Post get _currentPost => feedGxC.currentPost;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    double bottomPadding = 0;
    if (widget.bottomPadding == null) {
      bottomPadding = MediaQuery.of(context).padding.bottom + 40.0.wh;
    } else {
      bottomPadding = widget.bottomPadding!;
    }
    return Obx(
      () => Container(
        height: Get.height * 0.7,
        margin: EdgeInsets.only(
          left: 10,
          right: 10,
          bottom: math.max(0, bottomPadding - 25),
        ),
        child: (_currentPost.id == '')
            ? const SizedBox()
            : Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _profileImageAndCaption(),
                  if (widget.shouldShowFab) _expandableFAB(),
                ],
              ),
      ),
    );
  }

  Widget _captionAndHandle() => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _caption(),
          _handle(),
        ],
      );

  TextButton _handle() => TextButton(
        style: TextButton.styleFrom(
          padding: EdgeInsets.zero,
          minimumSize: const Size(50, 30),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          alignment: Alignment.centerLeft,
        ),
        onPressed: () {
          Common().openProfilePage(
            context,
            _currentPost.author.id,
            shouldNavigateToCurrentUser: widget.shouldNavigateToCurrentUser,
          );
        },
        child: Text(
          '@${_currentPost.author.handle}',
          style: TextStyle(
            fontSize: 15.0.sp,
            color: _textColor(),
            fontWeight: FontWeight.bold,
          ),
        ),
      );

  Expanded _profileImageAndCaption() => Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            _repostOrParentChallenge,
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _profileImage(),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.only(
                      left: 10,
                      right: 10,
                      bottom: 10,
                    ),
                    child: widget.shouldShowHandle
                        ? _captionAndHandle()
                        : _caption(),
                  ),
                ),
              ],
            ),
          ],
        ),
      );

  Widget _profileImage() => widget.shouldShowAuthorAvatar
      ? Common().avatarFromAuthor(
          context,
          _currentPost.author,
          shouldNavigateToCurrentUser: widget.shouldNavigateToCurrentUser,
          ringDiff: 2,
          ringWidth: 2,
        )
      : const SizedBox(
          width: 1,
          height: 28 * 2,
        );

  Widget _caption() {
    if (_currentPost.caption == null) {
      return const SizedBox(height: 20);
    }
    return GestureDetector(
      onTap: () {
        setState(() {
          if (_currentPost.caption != null) {
            if (_currentPost.caption!.length > 14) {
              feedGxC.isCaptionExpanded.value =
                  !feedGxC.isCaptionExpanded.value;
            }
          }
        });
      },
      child: SizedBox(
        width: Get.width - 150,
        child: ExpandableTextFromSegments(
          _currentPost.type == 1 ? [] : _currentPost.caption ?? [],
          trimLines: 1,
          contracted: !feedGxC.isCaptionExpanded.value,
          onStateToggled: (isContracted) {
            setState(() {
              feedGxC.isCaptionExpanded.value = !isContracted;
            });
          },
          tagsOrMentionsColor: WildrColors.primaryColor,
          // tagsOrMentionsColor: _textColor(),
          readMoreButtonText: ' ...',
          contentStyle: TextStyle(
            fontSize: 14.0.sp,
            color: _textColor(),
            fontWeight: FontWeight.w500,
          ),
          clickableTextStyle: Common().captionTextStyle(color: _textColor()),
          shouldOptimize: true,
          optimizeLength: 15,
        ),
      ),
    );
  }

  Color _textColor() {
    if (widget.shouldKeepTextColorWhite) {
      return Colors.white;
    }
    if (Get.isDarkMode) {
      return Colors.white;
    }
    if ((feedGxC.currentPost.subPosts?[feedGxC.currentSubIndex].type ?? -1) ==
        1) {
      return Colors.black87;
    }
    return Colors.white;
  }

  Widget get _repostOrParentChallenge {
    if (_currentPost.isRepost() && !feedGxC.isCaptionExpanded.value) {
      return _repostMeta();
    }
    return const SizedBox();
  }

  Widget _repostMeta() {
    final Author? author = _currentPost.repostMeta?.parentPost?.author;
    if (author == null) {
      return Container();
    }
    const double fontSize = 13.5;
    final child = Container(
      padding: const EdgeInsets.only(top: 5, bottom: 5, right: 10, left: 5),
      color: const Color(0xFF343837).withOpacity(0.75),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Common().avatarFromAuthor(
            context,
            author,
            radius: 10,
            ringDiff: 1,
            shouldNavigateToCurrentUser: false,
            // fontSize: fontSize,
          ),
          const SizedBox(width: 5),
          Text(
            _appLocalizations.post_repostedFrom,
            style: const TextStyle(color: Colors.white, fontSize: fontSize),
          ),
          Text(
            author.handle,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: fontSize,
            ),
          ),
        ],
      ),
    );
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: GestureDetector(
          onTap: () {
            context.pushRoute(
              SinglePostPageRoute(
                postId: _currentPost.repostMeta!.parentPost!.id,
              ),
            );
          },
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: 3,
              sigmaY: 3,
              tileMode: TileMode.mirror,
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  Padding _expandableFAB() => Padding(
        padding: const EdgeInsets.only(bottom: 4.0),
        child: PostHamburgerMenu(
          feedGxC: feedGxC,
          key: widget.key,
          pageId: widget.pageId,
        ),
      );
}
