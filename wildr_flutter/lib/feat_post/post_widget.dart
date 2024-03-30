import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:preload_page_view/preload_page_view.dart' as preload_page_view;
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_type.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_wrapper.dart';
import 'package:wildr_flutter/feat_post/post_video_body.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';

part 'post_image_body.dart';

void printD(dynamic message) {
  debugPrint('PostWidget: $message');
}

class PostWidget extends StatefulWidget {
  final Post post;
  final FeedGxC feedGxC;
  final int itemIndex;
  final bool canTriggerVideoLoader;
  final String pageId;
  final EdgeInsets? textPostPadding;
  final int? initialPageIndex;
  final bool shouldNavigateToCurrentUserTab;

  const PostWidget({
    required this.post,
    required this.feedGxC,
    required this.itemIndex,
    this.canTriggerVideoLoader = true,
    required this.pageId,
    this.textPostPadding,
    this.initialPageIndex,
    this.shouldNavigateToCurrentUserTab = true,
    super.key,
  });

  @override
  State<PostWidget> createState() => _PostWidgetState();
}

class _PostWidgetState extends State<PostWidget> {
  // PageController? _pageController;
  preload_page_view.PreloadPageController? _pageController;
  int subIndex = 0;

  late final Post post = widget.post;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    if ((post.subPosts?.length ?? 0) > 1) {
      _pageController = preload_page_view.PreloadPageController(
        initialPage: widget.initialPageIndex ??
            // Since the currentPost in feedGxC is not updated yet, we need to
            // use the multiPostIdToSubIndex map to get the initial page index.
            widget.feedGxC.multiPostIdToSavedSubIndex[post.id] ??
            0,
      )..addListener(() {
          subIndex = _pageController!.page?.toInt() ?? 0;
        });
    }
    super.initState();
  }

  Widget _textPost(SubPost subPost) => Container(
        color: Theme.of(context).colorScheme.background,
        padding: widget.textPostPadding ?? Common().textPostPadding(context),
        child: Center(
          child: SmartTextCommon().getAutoResizeTextForFeedFromSubPost(
            subPost,
            context,
            shouldNavigateToCurrentUserTab:
                widget.shouldNavigateToCurrentUserTab,
          ),
        ),
      );

  Widget _deletedPost({bool isOriginalPostDeleted = false}) => Material(
        child: Container(
          color: Theme.of(context).colorScheme.background,
          padding: Common().textPostPadding(context),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                WildrIcon(
                  isOriginalPostDeleted
                      ? WildrIcons.repost
                      : WildrIcons.exclamation_circle_outline,
                  color: Colors.red,
                ),
                Text(
                  isOriginalPostDeleted
                      ? _appLocalizations.post_originalPostDeleted
                      : _appLocalizations.post_thisPostWasDeleted,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 24,
                    color: Get.theme.textTheme.titleLarge!.color,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );

  Widget _imagePost(SubPost subPost) => PostImageBody(
        subPost.mediaPath,
        fallbackImageUrl: subPost.thumbnail,
      );

  Widget _videoPost(SubPost subPost, int subIndex, bool showThumbnail) =>
      showThumbnail
          ? PostImageBody(subPost.thumbnail ?? '')
          : PostVideoBody(
              key: PageStorageKey('keyData${subPost.mediaPath}'),
              feedGxC: widget.feedGxC,
              parentIndex: widget.itemIndex,
              url: subPost.mediaPath,
              subIndex: subIndex,
              thumbUrl: subPost.thumbnail,
              pageId: widget.pageId,
            );

  Widget _content({bool showThumbnail = false}) {
    if (post.isDeleted()) {
      return _deletedPost();
    }
    if (post.isRepost() && post.isParentPostDeleted()) {
      return _deletedPost(isOriginalPostDeleted: true);
    }
    if ((post.subPosts?.length ?? 0) == 1) {
      final SubPost subPost = post.subPosts!.first;
      if (subPost.type == 1) {
        return _textPost(subPost);
      } else if (subPost.type == 2) {
        return _imagePost(subPost);
      } else if (subPost.type == 3) {
        return _videoPost(subPost, 0, showThumbnail);
      } else {
        return Text(_appLocalizations.post_thisIsMultiPost);
      }
    }
    return preload_page_view.PreloadPageView.builder(
      controller: _pageController,
      preloadPagesCount: 2,
      itemCount: post.subPosts?.length ?? 0,
      onPageChanged: (index) {
        widget.feedGxC.currentSubIndex = index;
        setState(() {});
        Common()
            .mainBloc(context)
            .add(OnFeedWidgetChangedEvent(widget.itemIndex, widget.pageId));
      },
      itemBuilder: (context, index) {
        final SubPost subPost = post.subPosts![index];
        if (subPost.type == 1) {
          return _textPost(subPost);
        } else if (subPost.type == 2) {
          return _imagePost(subPost);
        } else if (subPost.type == 3) {
          return _videoPost(subPost, index, showThumbnail);
        } else {
          return Text(_appLocalizations.post_thisIsMultiPost);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: (context, state) {
          if (state is UpdateSensitiveContentState) {
            setState(() {
              if (state.feedOverlay == PostOverlayType.NONE) {
                if (widget.feedGxC.currentPost.id == post.id) {
                  widget.feedGxC.currentPost.sensitiveStatus = null;
                  widget.feedGxC.userModification[widget.feedGxC.currentPost.id]
                      ?.add(
                    UserPostModification(
                      key: 'sensitiveStatus',
                      value: null,
                    ),
                  );
                }
              }
            });
          }
        },
        child: post.overlay == PostOverlayType.NONE
            ? _content()
            : PostOverlayWrapper(
                post: post,
                child: _content(showThumbnail: true),
              ),
      );

  @override
  void dispose() {
    _pageController?.dispose();
    super.dispose();
  }
}
