import 'dart:io';
import 'dart:ui';

import 'package:animated_widgets/widgets/opacity_animated.dart';
import 'package:animated_widgets/widgets/scale_animated.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostVideoBody extends StatefulWidget {
  final int parentIndex;
  final int subIndex;
  final String url;
  final String? thumbUrl;
  final FeedGxC feedGxC;
  final String pageId;

  const PostVideoBody({
    super.key,
    required this.url,
    required this.parentIndex,
    required this.feedGxC,
    required this.pageId,
    this.subIndex = -1,
    this.thumbUrl,
  });

  @override
  PostVideoBodyState createState() => PostVideoBodyState();
}

class PostVideoBodyState extends State<PostVideoBody> {
  late VideoPlayerController _videoPlayerController;
  late final FeedGxC _feedGxC = widget.feedGxC;

  void _toggleMute() {
    final double currentVolume = _videoPlayerController.value.volume;
    if (currentVolume > 0) {
      _videoPlayerController.setVolume(0.0);
      _feedGxC
        ..showMuteStatus = true
        ..isMuted = true;
    } else {
      _videoPlayerController.setVolume(1.0);
      _feedGxC
        ..showMuteStatus = true
        ..isMuted = false;
    }
  }

  Widget _videoPlayer() {
    if (_videoPlayerController.value.aspectRatio < 0.6) {
      return SizedBox.expand(
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _videoPlayerController.value.size.width,
            height: _videoPlayerController.value.size.height,
            child: VideoPlayer(_videoPlayerController),
          ),
        ),
      );
    }

    return Center(
      child: AspectRatio(
        aspectRatio: _videoPlayerController.value.aspectRatio,
        child: VideoPlayer(_videoPlayerController),
      ),
    );
  }

  Widget _blurredThumbImage() => Container(
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: CachedNetworkImageProvider(widget.thumbUrl ?? ''),
            fit: BoxFit.cover,
          ),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.transparent,
            ),
          ),
        ),
      );

  Widget _playPauseButton() => Center(
        child: Obx(
          () => ScaleAnimatedWidget.tween(
            animationFinished: (value) {
              if (value) {
                Future.delayed(const Duration(milliseconds: 300)).then(
                  (value) {
                    _feedGxC.showMuteStatus = false;
                  },
                );
              }
            },
            enabled: _feedGxC.showMuteStatus,
            duration: const Duration(milliseconds: 300),
            scaleDisabled: 0.4,
            scaleEnabled: 1.2,
            curve: Curves.easeOutCirc,
            child: OpacityAnimatedWidget.tween(
              enabled: _feedGxC.showMuteStatus,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCirc,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(100),
                child: ColoredBox(
                  // height: 31,
                  color: const Color(0x40000000),
                  child: WildrIcon(
                    _feedGxC.isMuted
                        ? WildrIcons.volume_off_filled
                        : WildrIcons.volume_up_filled,
                    size: 50,
                    color: Colors.white54,
                  ),
                ),
              ),
            ),
          ),
        ),
      );

  Widget _content() => Stack(
        alignment: Alignment.bottomCenter,
        children: [
          if (_videoPlayerController.value.aspectRatio > 0.6)
            _blurredThumbImage(),
          _videoPlayer(),
          _playPauseButton(),
          VideoProgressIndicator(
            _videoPlayerController,
            colors:
                const VideoProgressColors(playedColor: WildrColors.accentColor),
            allowScrubbing: false,
          ),
        ],
      );

  @override
  void initState() {
    super.initState();

    if (widget.url.contains('compressed_')) {
      _videoPlayerController = VideoPlayerController.file(
        File(widget.url),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );
    } else {
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(widget.url),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );
    }

    _videoPlayerController
      ..setLooping(true)
      ..setVolume(_feedGxC.isMuted ? 0 : 1)
      ..initialize().then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) => VisibilityDetector(
        // Add a key to ensure that the visibility
        // callback is properly called for
        // different widgets. Needed so that the video
        // will autoplay when changing
        // pages.
        key: Key(
          '${widget.pageId}/${widget.parentIndex}/${widget.subIndex}/${widget.feedGxC.currentPost.id}',
        ),
        onVisibilityChanged: (visibilityInfo) {
          // Ensure that the widget is mounted before accessing the controller.
          // The controller will be disposed when the
          // widget is unmounted, causing
          // an exception if you try to access it after that.
          if (!mounted) return;

          if (visibilityInfo.visibleFraction >= 0.5) {
            _videoPlayerController
              ..play()
              ..setVolume(_feedGxC.isMuted ? 0 : 1);
          } else if (visibilityInfo.visibleFraction < 0.5) {
            _videoPlayerController
              ..pause()
              ..seekTo(Duration.zero);
          }
        },
        child: _videoPlayerController.value.isInitialized
            ? GestureDetector(
                onLongPressStart: (_) => _videoPlayerController.pause(),
                onLongPressEnd: (_) => _videoPlayerController.play(),
                onTap: _toggleMute,
                child: _content(),
              )
            : Stack(
                children: [
                  const Center(
                    child: CupertinoActivityIndicator(),
                  ),
                  if (widget.thumbUrl != null)
                    Common().imageView(
                      widget.thumbUrl ?? '',
                      height: Common().mainBloc(context).height,
                      width: Get.width,
                    ),
                ],
              ),
      );

  @override
  void dispose() {
    _videoPlayerController.dispose();
    super.dispose();
  }

  void print(dynamic message) {
    debugPrint('[FeedVideoWidget] $message');
  }
}
