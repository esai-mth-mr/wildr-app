import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:video_player/video_player.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/v2/media_tab/gxc/video_player_gxc.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrVideoPlayer extends StatefulWidget {
  final File? file;
  final AssetEntity? entity;
  final bool isUsingMediaUrl;

  const WildrVideoPlayer({
    super.key,
    this.file,
    this.entity,
    this.isUsingMediaUrl = true,
  });

  @override
  State<WildrVideoPlayer> createState() => _WildrVideoPlayerState();
}

class _WildrVideoPlayerState extends State<WildrVideoPlayer> {
  final Stopwatch _stopwatch = Stopwatch();
  VideoPlayerController? _controller;
  final VideoPlayerGxC _videoPlayerGxC = Get.put(VideoPlayerGxC());

  @override
  void initState() {
    super.initState();
    _stopwatch.start();
    if (widget.isUsingMediaUrl) {
      if (widget.entity != null) {
        _initVideoWithMediaUrl();
      } else if (widget.file != null) {
        _initVideoWithFile();
      }
    }
  }

  @override
  void didUpdateWidget(WildrVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.entity == oldWidget.entity &&
        widget.file == oldWidget.file &&
        widget.isUsingMediaUrl == oldWidget.isUsingMediaUrl) {
      return;
    }
    _controller?.dispose();
    _controller = null;
    _stopwatch.start();
    if (widget.isUsingMediaUrl) {
      if (widget.entity != null) {
        _initVideoWithMediaUrl();
      } else if (widget.file != null) {
        _initVideoWithFile();
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _initVideoWithFile() {
    final file = widget.file!;
    _stopwatch.stop();
    if (!mounted) {
      return;
    }
    _controller = VideoPlayerController.file(file)
      ..initialize().then((_) {
        setState(() {});
      });
    _controller!.addListener(() {
      _videoPlayerGxC.syncWithVideoPlayerController(_controller);
    });
  }

  void _initVideoWithMediaUrl() {
    final entity = widget.entity!;
    entity.getMediaUrl().then((url) {
      _stopwatch.stop();
      if (!mounted || url == null) {
        return;
      }
      _controller = VideoPlayerController.networkUrl(Uri.parse(url))
        ..initialize().then((_) {
          setState(() {});
        });
      _controller!.addListener(() {
        _videoPlayerGxC.syncWithVideoPlayerController(_controller);
      });
    });
  }

  Widget _videoPlayer() {
    final VideoPlayerController controller = _controller!;
    return Stack(
      children: <Widget>[
        VideoPlayer(controller),
        if (!_videoPlayerGxC.isPlaying)
          IgnorePointer(
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.black38,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: const Icon(Icons.play_arrow, color: Colors.white),
              ),
            ),
          ),
      ],
    );
  }

  Widget _videoDuration(VideoPlayerController videoPlayerController) => Align(
      alignment: Alignment.bottomCenter,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              CreatePostCommon().formatDurationToMinuteAndSecond(
                _videoPlayerGxC.currentPosition,
              ),
              style: const TextStyle(color: Colors.white),
            ),
            const SizedBox(width: 4.0),
            const Text(
              '/',
              style: TextStyle(color: Colors.white),
            ),
            const SizedBox(width: 4.0),
            Text(
              CreatePostCommon().formatDurationToMinuteAndSecond(
                videoPlayerController.value.duration,
              ),
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );

  Widget _videoProgress() => Align(
      alignment: Alignment.bottomCenter,
      child: LinearProgressIndicator(
        value: _videoPlayerGxC.progress,
        backgroundColor: Colors.grey,
        valueColor: const AlwaysStoppedAnimation<Color>(WildrColors.emerald800),
      ),
    );

  @override
  Widget build(BuildContext context) {
    if (_controller?.value.isInitialized != true) {
      return const SizedBox.shrink();
    }
    final VideoPlayerController videoPlayerController = _controller!;
    return AspectRatio(
      aspectRatio: videoPlayerController.value.size.width,
      child: Obx(
        () => Stack(
          children: <Widget>[
            GestureDetector(
              child: _videoPlayer(),
              onTap: () {
                _videoPlayerGxC.isPlaying
                    ? videoPlayerController.pause()
                    : videoPlayerController.play();
                setState(() {});
              },
            ),
            _videoDuration(_controller!),
            _videoProgress(),
          ],
        ),
      ),
    );
  }
}
