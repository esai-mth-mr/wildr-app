// ignore_for_file: cascade_invocations

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:video_compress/video_compress.dart';
import 'package:video_player/video_player.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v1/cropper.dart';

void print(dynamic message) {
  debugPrint('[PreviewAndCropMediaPost]: $message');
}

class PreviewAndCropMediaPost extends StatefulWidget {
  final bool isVideo;
  final bool isFromCamera;
  final String imageOrVideoPath;
  final CreatePostGxC createPostGxC;

  const PreviewAndCropMediaPost({
    required this.imageOrVideoPath,
    this.isVideo = false,
    this.isFromCamera = false,
    required this.createPostGxC,
    super.key,
  });

  @override
  State<PreviewAndCropMediaPost> createState() =>
      _PreviewAndCropMediaPostState();
}

class _PreviewAndCropMediaPostState extends State<PreviewAndCropMediaPost> {
  @override
  void initState() {
    super.initState();
  }

  Widget _content(BuildContext context) => widget.isVideo
      ? VideoPlayerView(
          path: widget.imageOrVideoPath,
          createPostGxC: widget.createPostGxC,
          isFromCamera: widget.isFromCamera,
        )
      : ImageCroppingView(
          path: widget.imageOrVideoPath,
          height: Common().mainBloc(context).height,
          createPostGxC: widget.createPostGxC,
        );

  @override
  Widget build(BuildContext context) {
    debugPrint(widget.imageOrVideoPath);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
        iconTheme: const IconThemeData(
          color: Colors.white,
        ),
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        title: Container(
          margin: const EdgeInsets.only(left: 20),
          height: 40,
          width: 40,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(50),
            child: GestureDetector(
              onTap: () {
                Navigator.of(context).pop();
              },
              child: Container(
                padding: const EdgeInsets.all(10),
                color: const Color(0x40000000),
                child: const Icon(
                  Icons.close,
                  size: 20,
                ),
              ),
            ),
          ),
        ),
        centerTitle: false,
      ),
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.black,
      body: _content(context),
    );
  }

  @override
  void dispose() {
    debugPrint('Disposing FinalizePost');
    super.dispose();
  }
}

class ImageCroppingView extends StatefulWidget {
  final String path;
  final double height;
  final CreatePostGxC createPostGxC;

  const ImageCroppingView({
    required this.path,
    required this.height,
    required this.createPostGxC,
    super.key,
  });

  @override
  ImageCroppingViewState createState() => ImageCroppingViewState();
}

class ImageCroppingViewState extends State<ImageCroppingView> {
  final GlobalKey<CropState> _cropKey = GlobalKey<CropState>();
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  Widget _cropView() => Container(
        height: widget.height,
        color: Colors.black,
        child: Cropper.file(
          File(widget.path),
          key: _cropKey,
          aspectRatio: 9 / 16,
          maximumScale: 5.0,
          alwaysShowGrid: true,
        ),
      );

  Future<File?> _getCroppedFile() async {
    final crop = _cropKey.currentState;
    if (crop == null) {
      return null;
    }
    // final double scale = crop.scale;
    final Rect? area = crop.area;
    if (area == null) {
      return null;
    }
    final sampledFile = await ImageCrop.sampleImage(
      file: File(widget.path),
      preferredWidth: (1024 / crop.scale).round(),
      preferredHeight: (1829 / crop.scale).round(),
    );
    final croppedFile = await ImageCrop.cropImage(
      file: sampledFile,
      area: crop.area!,
    );
    return croppedFile;
  }

  Future<void> _addMoreMedia() async {
    final File? croppedFile = await _getCroppedFile();
    if (croppedFile == null) {
      return;
    }
    final ImagePostData postData = ImagePostData();
    postData.croppedPath = croppedFile.path;
    postData.originalPath = widget.path;
    postData.croppedFile = croppedFile;
    widget.createPostGxC.addPostData(postData);
  }

  Future<void> _onAddMoreMedia() async {
    debugPrint('AddMoreMedia');
    if (widget.createPostGxC.postCount == 5) {
      Common().showErrorSnackBar(
        _appLocalizations.createPost_postLimitReached,
        context,
      );
      return;
    }
    await _addMoreMedia();
    if (!mounted) return;
    Navigator.of(context).pop(ADD_ANOTHER_POST);
  }

  Future<void> _onNext() async {
    if (widget.createPostGxC.postCount == 5) {
      Common().showErrorSnackBar(
        _appLocalizations.createPost_postLimitReached,
        context,
      );
      return;
    }
    await _addMoreMedia();
    if (!mounted) return;
    Navigator.of(context).pop(OPEN_UPLOAD_PAGE);
  }

/*  Widget _previewButton() {
    return TextButton(
      child: Text(
        "Preview",
        style: TextStyle(fontSize: 15.0.sp,
         color: Colors.white, fontWeight: FontWeight.w600),
      ),
      style: Common().buttonStyle(isFilled: false),
      onPressed: () {},
    );
  }*/

  Widget _bottomButtons(bool showAddButton) =>
      CreatePostCommon().bottomButtonsRow(
        showAddButton
            ? CreatePostCommon().addButton(onPressed: _onAddMoreMedia)
            : Container(height: 1),
        CreatePostCommon().bottomRightButton(onPressed: _onNext),
      );

  @override
  Widget build(BuildContext context) => SafeArea(
        top: false,
        left: false,
        child: Column(
          children: [
            Expanded(child: _cropView()),
            _bottomButtons(widget.createPostGxC.postCount < 4),
          ],
        ),
      );
}

class VideoPlayerView extends StatefulWidget {
  final String path;
  final CreatePostGxC createPostGxC;
  final bool isFromCamera;

  const VideoPlayerView({
    super.key,
    required this.path,
    required this.createPostGxC,
    required this.isFromCamera,
  });

  @override
  VideoPlayerViewState createState() => VideoPlayerViewState();
}

class VideoPlayerViewState extends State<VideoPlayerView> {
  late VideoPlayerController _videoController;

  @override
  void initState() {
    super.initState();
    _videoController = VideoPlayerController.file(File(widget.path));
    // _controller = VideoPlayerController.network('https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_20mb.mp4');

    _videoController.setLooping(true);
    _videoController.initialize().then((value) {
      debugPrint('Initialized');
      setState(
        () {
          _videoController.play();
        },
      );
    });
  }

  Future<void> _addMoreMedia() async {
    await _videoController.pause();
    final VideoPostData postData = VideoPostData();
    final File thumbnailFile = await VideoCompress.getFileThumbnail(
      widget.path,
    );
    postData.thumbFile = thumbnailFile;
    postData.originalPath = widget.path;
    // Only compress the video if it's recorded directly from in-app camera.
    postData.isFromCamera = widget.isFromCamera;
    widget.createPostGxC.addPostData(postData);
  }

  Future<void> _onNext() async {
    await _videoController.pause();
    await _addMoreMedia();
    if (!mounted) return;
    Navigator.of(context).pop(OPEN_UPLOAD_PAGE);
  }

  Future<void> _onAddMoreMedia() async {
    await _addMoreMedia();
    if (!mounted) return;
    Navigator.of(context).pop(ADD_ANOTHER_POST);
  }

  Widget _stretchIt(Widget child) => (_videoController.value.aspectRatio < 0.6)
      ? child
      : Center(
          child: AspectRatio(
            aspectRatio: _videoController.value.aspectRatio,
            child: child,
          ),
        );

  @override
  Widget build(BuildContext context) {
    if (_videoController.value.isInitialized) {
      return SafeArea(
        child: GestureDetector(
          onTap: () {
            setState(() {
              _videoController.value.isPlaying
                  ? _videoController.pause()
                  : _videoController.play();
            });
          },
          child: Stack(
            children: [
              Hero(
                tag: 'Image',
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: _stretchIt(VideoPlayer(_videoController)),
                ),
              ),
              Align(
                alignment: Alignment.bottomRight,
                child: Padding(
                  padding: const EdgeInsets.only(
                    top: 28,
                    left: 30,
                    right: 10,
                    bottom: 15,
                  ),
                  child: CreatePostCommon().bottomButtonsRow(
                    widget.createPostGxC.postCount < 4
                        ? CreatePostCommon()
                            .addButton(onPressed: _onAddMoreMedia)
                        : Container(height: 1),
                    CreatePostCommon().bottomRightButton(onPressed: _onNext),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      // If the VideoPlayerController is
      // still initializing, show a loading spinner.
      return const Center(child: CircularProgressIndicator());
    }
  }

  @override
  void dispose() {
    debugPrint('Dispose of Finalize Post()');
    _videoController.pause();
    _videoController.dispose();
    super.dispose();
  }
}
