import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:video_player/video_player.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v1/preview_text_post.dart';
import 'package:wildr_flutter/routes.gr.dart';

class PreviewMultiPostPage extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final bool shouldShowNextButton;
  final int initialIndex;

  const PreviewMultiPostPage({
    required this.createPostGxC,
    this.shouldShowNextButton = true,
    this.initialIndex = 0,
    super.key,
  });

  @override
  PreviewMultiPostPageState createState() => PreviewMultiPostPageState();
}

class PreviewMultiPostPageState extends State<PreviewMultiPostPage> {
  late int _currentIndex = widget.initialIndex;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  late final PageController _pageController =
      PageController(initialPage: _currentIndex);

  @override
  void initState() {
    super.initState();
  }

  Widget _textPost(List<Segment> segments) => PreviewTextPost(
        segments,
        widget.createPostGxC.height,
        shouldAddDecoration: false,
      );

  Widget _imagePost(File imageFile) => Image.file(
        imageFile,
        fit: BoxFit.fitHeight,
      );

  Widget _pageView() => Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.createPostGxC.postCount,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final PostData postData = widget.createPostGxC.posts[index];
              if (postData is TextPostData) {
                return _textPost(postData.segments ?? []);
              } else if (postData is ImagePostData) {
                return _imagePost(postData.croppedFile!);
              } else if (postData is VideoPostData) {
                return PreviewMultiPostVideoPlayer(
                  path: postData.originalPath,
                  shouldPlay: _currentIndex == index,
                  height: widget.createPostGxC.height,
                );
              } else {
                return Text(_appLocalizations.createPost_thisIsVideoPost);
              }
            },
          ),
        ],
      );

  Widget _bottomRow() {
    debugPrint('BottomRow ${widget.shouldShowNextButton}');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Container()),
          if (widget.shouldShowNextButton)
            CreatePostCommon().bottomRightButton(
              onPressed: () {
                Navigator.pop(context, SHOULD_CALL_SET_STATE);
                context
                    .pushRoute(
                      UploadMultiMediaPostV1Route(
                        createPostGxC: widget.createPostGxC,
                      ),
                    )
                    .then((shouldPop) {});
              },
            ),
        ],
      ),
    );
  }

  Widget _body() => SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(
              child: SizedBox(
                height: widget.createPostGxC.height,
                child: _pageView(),
              ),
            ),
            _bottomRow(),
          ],
        ),
      );

  void _edit() {
    if (_pageController.page != null) {
      widget.createPostGxC.editIndex = _currentIndex;
      final PostData postData = widget.createPostGxC.posts[_currentIndex];
      if (postData is TextPostData) {
        debugPrint('Length = ${postData.blocks?.length}');
        context
            .pushRoute(
              EditTextPostV1Route(
                createPostGxC: widget.createPostGxC,
                textPostData: postData,
              ),
            )
            .then((value) => setState(() {}));
      }
    }
  }

  Widget _editButton() {
    final PostData postData = widget.createPostGxC.posts[_currentIndex];
    return (postData is TextPostData)
        ? WildrIconButton(WildrIcons.pencil_filled, onPressed: _edit)
        : Container();
  }

  void _deleteCurrentPage() {
    //Deleting an item moves the page to right, unless it's the last item
    if (widget.createPostGxC.posts.length == 1) {
      widget.createPostGxC.posts.removeAt(_currentIndex);
      widget.createPostGxC.postCount -= 1;
      Navigator.of(context).pop(IS_NOW_EMPTY);
    } else {
      final int indexToRemove = _currentIndex;
      if (_currentIndex == widget.createPostGxC.posts.length - 1) {
        _currentIndex--;
      }
      widget.createPostGxC.posts.removeAt(indexToRemove);
      widget.createPostGxC.postCount -= 1;
      setState(() {});
    }
    debugPrint(widget.createPostGxC.postCount.toString());
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        resizeToAvoidBottomInset: true,
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          systemOverlayStyle: Theme.of(context).brightness == Brightness.dark
              ? SystemUiOverlayStyle.light
              : SystemUiOverlayStyle.dark,
          shadowColor: Colors.transparent,
          backgroundColor: Colors.transparent,
          centerTitle: true,
          title: Common().dotIndicator(
            shouldShow: widget.createPostGxC.postCount > 1,
            count: widget.createPostGxC.postCount,
            currentIndex: _currentIndex,
          ),
          actions: [
            _editButton(),
            IconButton(
              onPressed: _deleteCurrentPage,
              icon: const WildrIcon(
                WildrIcons.trash_filled,
              ),
            ),
          ],
        ),
        body: _body(),
      );
}

class PreviewMultiPostVideoPlayer extends StatefulWidget {
  final bool shouldPlay;
  final String path;
  final double height;

  const PreviewMultiPostVideoPlayer({
    required this.shouldPlay,
    required this.path,
    required this.height,
    super.key,
  });

  @override
  State<PreviewMultiPostVideoPlayer> createState() =>
      _PreviewMultiPostVideoPlayerState();
}

class _PreviewMultiPostVideoPlayerState
    extends State<PreviewMultiPostVideoPlayer> {
  late VideoPlayerController _videoPlayerController;

  @override
  void initState() {
    _videoPlayerController = VideoPlayerController.file(File(widget.path));
    _videoPlayerController.setLooping(true);
    super.initState();
    _videoPlayerController.initialize().then((value) {
      if (widget.shouldPlay) {
        setState(() {
          _videoPlayerController.play();
        });
      }
    });
  }

  Widget _stretchIt(Widget child) {
    final size = MediaQuery.of(context).size;
    final deviceRatio = size.width / widget.height;
    return Transform.scale(
      scale: _videoPlayerController.value.aspectRatio / deviceRatio,
      child: Center(
        child: AspectRatio(
          aspectRatio: _videoPlayerController.value.aspectRatio,
          child: child,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_videoPlayerController.value.isInitialized) {
      if (widget.shouldPlay) {
        Future.delayed(const Duration(milliseconds: 500))
            .then((value) => _videoPlayerController.play());
      }

      return GestureDetector(
        onTap: () {
          setState(() {
            _videoPlayerController.value.isPlaying
                ? _videoPlayerController.pause()
                : _videoPlayerController.play();
          });
        },
        child: _stretchIt(VideoPlayer(_videoPlayerController)),
      );
    } else {
      // If the VideoPlayerController
      // is still initializing, show a loading spinner.
      return const Center(child: CircularProgressIndicator());
    }
  }

  @override
  void dispose() {
    _videoPlayerController..pause()
    ..dispose();
    super.dispose();
  }
}

class MultiPostCounterWidget extends StatelessWidget {
  final String text;

  const MultiPostCounterWidget(this.text, {super.key});

  @override
  Widget build(BuildContext context) => Common().clipIt(
        radius: 15,
        child: Container(
          height: 21,
          width: 45,
          padding: const EdgeInsets.only(left: 10, right: 10),
          color: const Color(0x40000000),
          child: Center(
            child: Text(
              text,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ),
      );
}
