part of '../create_post_page_v2.dart';

// A screen that takes in a list of cameras and the Directory to store images.
class CameraTabV2 extends StatefulWidget {
  final Function navigateToGallery;
  final CreatePostGxC createPostGxC;
  final bool isChallengePost;
  final Challenge? defaultSelectedChallenge;

  const CameraTabV2({
    required this.navigateToGallery,
    required this.createPostGxC,
    this.isChallengePost = false,
    this.defaultSelectedChallenge,
    super.key,
  });

  @override
  CameraTabV2State createState() => CameraTabV2State();
}

class CameraTabV2State extends State<CameraTabV2>
    with AutomaticKeepAliveClientMixin<CameraTabV2>, TickerProviderStateMixin {
  CameraController? _cameraController;
  bool isCameraAvailable = false;
  bool hasCameraPermissions = false;
  bool hasMicrophonePermissions = false;
  late List<CameraDescription> cameras = [];
  final ValueNotifier<bool> _isRecording = ValueNotifier(false);

  //late List<CameraDescription> _availableCameras;
  Future<void>? _initializeControllerFuture;
  late AnimationController animationController;
  late Animation animation;
  late AnimationController flipAnimationController;
  late Animation flipAnimation;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  AnimationStatus fliAnimationStatus = AnimationStatus.dismissed;
  var zoomLevel = 0.0;
  bool isShowRecordingText = true;
  bool isPermanentlyDenied = false;
  late final _mainBloc = Common().mainBloc(context);

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((value) {
      isShowRecordingText =
          value.getBool(PrefKeys.kIsShowRecordVideoText) ?? true;
    });
    Permission.camera.status.then((value) {
      if (value.isGranted) {
        hasCameraPermissions = true;
      }
      Permission.microphone.status.then((value) {
        if (value.isGranted) {
          hasMicrophonePermissions = true;
        }
        setState(() {});
        availableCameras().then((availableCameras) {
          cameras = availableCameras;
          isCameraAvailable = true;
          if (cameras.isNotEmpty) {
            _initCamera(cameras[0]);
          } else {
            debugPrint('No camera available');
            isCameraAvailable = false;
          }
          setState(() {});
        }).catchError((err) {
          setState(() {});
          debugPrint(
            'availableCamerasError() Error:'
            ' $err.code\nError Message: $err.message',
          );
        });
      });
    });
    animationController =
        AnimationController(duration: const Duration(seconds: 30), vsync: this)
          ..addListener(() {
            if (animationController.isCompleted) {
              if (_cameraController?.value.isRecordingVideo ?? false) {
                _stopVideoRecording(stopAnimationController: true);
              }
            }
          });
  }

  @override
  Future<void> didChangeDependencies() async {
    if (!hasCameraPermissions) await getCameraPermission();
    super.didChangeDependencies();
  }

  @override
  bool get wantKeepAlive => true;

  // Camera
  Future<void> _initCamera(CameraDescription description) async {
    if (!hasCameraPermissions || !hasMicrophonePermissions) {
      debugPrint("[_initCamera] Don't have permissions, thus returning");
      return;
    }
    _cameraController = CameraController(
      description,
      ResolutionPreset.high,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );
    try {
      _initializeControllerFuture = _cameraController!.initialize();
      await _initializeControllerFuture;
      await _cameraController!.setFlashMode(FlashMode.off);
      await _cameraController!
          .lockCaptureOrientation(DeviceOrientation.portraitUp);
      setState(() {
        isCameraAvailable = true;
      });
    } catch (e) {
      debugPrint('Camera controller initialization failed');
      debugPrint(e.toString());
      setState(() {
        isCameraAvailable = false;
      });
    }
  }

  void _flipCamera() {
    debugPrint('Flip camera');
    if (_cameraController?.value.isRecordingVideo ?? false) return;
    HapticFeedback.lightImpact();
    final lensDirection = _cameraController!.description.lensDirection;
    CameraDescription newDescription;
    if (lensDirection == CameraLensDirection.front) {
      newDescription = cameras.firstWhere(
        (description) => description.lensDirection == CameraLensDirection.back,
      );
    } else {
      newDescription = cameras.firstWhere(
        (description) => description.lensDirection == CameraLensDirection.front,
      );
    }
    _initCamera(newDescription);
  }

  //Camera not available
  Widget _cameraNotAvailableWidget() => GestureDetector(
        onTap: _selectMedia,
        child: ColoredBox(
          color: const Color(0xBF000000),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Expanded(
                  child: Container(),
                ),
                Center(
                  child: Text(
                    _appLocalizations.createPost_cameraNotAvailable,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 15..sp,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Icon(
                    Icons.perm_media,
                    color: Colors.white60,
                    size: 20.0.w,
                  ),
                ),
                Expanded(
                  child: Container(),
                ),
                /* SizedBox(
                width: double.infinity,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: Icon(
                    Icons.close,
                    color: Colors.white,
                  ),
                ),
              ) */
              ],
            ),
          ),
        ),
      );

  //Camera available

  Widget _permissionsPage() => isPermanentlyDenied
      ? UploadPermissionBottomSheet(
          isCameraTab: true,
          title: _appLocalizations.createPost_cameraAccessRequired,
          subTitle: _appLocalizations.createPost_cameraAccessPermissionMessage,
          btnTitle: _appLocalizations.comm_cap_settings,
          onPressed: () async {
            await getCameraPermission(
              isOpenAppSettings: isPermanentlyDenied,
            );
          },
        )
      : CameraPermissionPage(
          title: _appLocalizations.createPost_cameraMicrophoneAccessRequest,
          subTitle: _appLocalizations.createPost_postContentAccessExplanation,
          actionButtonText: !hasCameraPermissions && !hasMicrophonePermissions
              ? _appLocalizations.createPost_enableCameraMicrophoneAccessPrompt
              : !hasCameraPermissions
                  ? _appLocalizations.createPost_enableCameraAccess
                  : _appLocalizations.createPost_enableMicrophoneAccess,
          onActionButtonTap: () async {
            await getCameraPermission();
          },
        );

  Future<void> _stopVideoRecording({
    bool stopAnimationController = false,
  }) async {
    if (widget.createPostGxC.posts.length == 5) {
      Common().showGetSnackBar(
        _appLocalizations.createPost_selectUpTo5PostsToShare,
        showIcon: true,
        snackPosition: SnackPosition.TOP,
      );
    } else {
      final video = await _cameraController!.stopVideoRecording();
      if (stopAnimationController) {
        animationController.stop();
      }
      animationController.reset();
      debugPrint(video.path);

      if (!mounted) return;
      final VideoPostData postData = VideoPostData();
      final thumbnailFile = await VideoCompress.getFileThumbnail(
        video.path,
        quality: 80,
      );
      postData
        ..thumbFile = thumbnailFile
        ..originalPath = video.path
        // Only compress the video if it's recorded directly from in-app camera.
        ..isFromCamera = true;
      widget.createPostGxC.addPostData(postData);
      widget.createPostGxC.update();
      await context.pushRoute(
        PostPreviewPageRoute(
          height: widget.createPostGxC.height,
          postData: postData,
          index: widget.createPostGxC.posts.length - 1,
          createPostGxC: widget.createPostGxC,
          onDelete: () async {
            await CreatePostCommon().showDeletePostBottomSheet(
              widget.createPostGxC.posts[widget.createPostGxC.posts.length - 1],
              context,
              widget.createPostGxC,
              widget.createPostGxC.posts.length - 1,
            );
          },
        ),
      );
    }
  }

  Widget _recordOrCaptureButton() => SizedBox(
        width: Get.width * 0.17,
        height: Get.width * 0.17,
        child: Padding(
          padding: const EdgeInsets.all(5.0),
          child: GestureDetector(
            onLongPressStart: (details) async {
              _mainBloc.add(StartRecordingEvent());
              final SharedPreferences prefs =
                  await SharedPreferences.getInstance();
              await prefs.setBool(PrefKeys.kIsShowRecordVideoText, false);
              isShowRecordingText = false;
              setState(() {});
              if (_cameraController == null) return;
              if (widget.createPostGxC.postCount == 5) {
                await HapticFeedback.vibrate();
                Common().showGetSnackBar(
                  _appLocalizations.createPost_selectUpTo5PostsToShare,
                  showIcon: true,
                  snackPosition: SnackPosition.TOP,
                );
                return;
              }
              try {
                await _cameraController!.startVideoRecording();
                await HapticFeedback.mediumImpact();
                await animationController.forward(from: 0);
              } catch (e) {
                debugPrint(e.toString());
              }
              _isRecording.value = true;
            },
            onLongPressEnd: (details) async {
              _mainBloc.add(StopRecordingEvent());
              debugPrint('OnLongPPressEnd');
              if (widget.createPostGxC.postCount != 5) {
                await _stopVideoRecording(
                  stopAnimationController: animationController.isAnimating,
                );
              }
              _isRecording.value = false;
            },
            onTap: () async {
              if (_cameraController == null ||
                  _cameraController!.value.isRecordingVideo) {
                return;
              } else {
                if (widget.createPostGxC.posts.length == 5) {
                  Common().showGetSnackBar(
                    _appLocalizations.createPost_selectUpTo5PostsToShare,
                    showIcon: true,
                    snackPosition: SnackPosition.TOP,
                  );
                } else {
                  if (_cameraController!.value.isRecordingVideo) {
                    return;
                  }
                  try {
                    await HapticFeedback.selectionClick();
                    context.loaderOverlay.show();
                    await _initializeControllerFuture;
                    XFile image = await _cameraController!.takePicture();
                    debugPrint(
                      'Took a picture and path is ${image.path}',
                    );
                    context.loaderOverlay.hide();
                    if (_cameraController!.description.lensDirection ==
                        CameraLensDirection.front) {
                      final rotatedFile =
                          await Common().fixRotation(image.path);
                      if (rotatedFile != null) image = rotatedFile;
                    }
                    if (!mounted) return;
                    final ImagePostData postData = ImagePostData()
                      ..croppedPath = image.path
                      ..originalPath = image.path
                      ..croppedFile = File(image.path);
                    widget.createPostGxC.addPostData(postData);
                    widget.createPostGxC.update();
                  } catch (e) {
                    debugPrint(e.toString());
                  }
                }
              }
            },
            child: ValueListenableBuilder(
              valueListenable: _isRecording,
              builder: (context, value, _) => SvgPicture.asset(
                value ? WildrIcons.recordingIcon : WildrIcons.captureIcon,
              ),
            ),
          ),
        ),
      );

  Widget _mediaInteractionRow() => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (hasCameraPermissions && hasMicrophonePermissions)
            WildrIconButton(
              _flashMode.getIcon(),
              size: 25.0.h,
              color: _flashMode != FlashModeEnum.OFF
                  ? WildrColors.yellow
                  : Colors.white,
              onPressed: () {
                HapticFeedback.selectionClick();
                if (_flashMode == FlashModeEnum.OFF) {
                  _flashMode = FlashModeEnum.AUTO;
                  _cameraController?.setFlashMode(FlashMode.auto);
                } else if (_flashMode == FlashModeEnum.AUTO) {
                  _flashMode = FlashModeEnum.ON;
                  _cameraController?.setFlashMode(FlashMode.always);
                } else if (_flashMode == FlashModeEnum.ON) {
                  _flashMode = FlashModeEnum.OFF;
                  _cameraController?.setFlashMode(FlashMode.off);
                }
                setState(() {});
              },
            ),
          const SizedBox(width: 30),
          if (hasCameraPermissions && hasMicrophonePermissions)
            _recordOrCaptureButton(),
          const SizedBox(width: 15),
          if (hasCameraPermissions && hasMicrophonePermissions)
            (cameras.length > 1)
                ? IconButton(
                    onPressed: _flipCamera,
                    icon: WildrIcon(
                      WildrIcons.flipCameraIcon,
                      color: Colors.white,
                      size: 25.0.h,
                    ),
                  )
                : SizedBox(width: 30.0.w, height: 30.0.w),
        ],
      );

  Widget _cameraWidget(context) => Container(
        padding: EdgeInsets.only(
          bottom: 10.0.h,
        ),
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height,
        child: Common().clipIt(
          radius: 25,
          child: CameraPreview(_cameraController!),
        ),
      );

  FlashModeEnum _flashMode = FlashModeEnum.OFF;

  List<Widget> _stackChildren() {
    final List<Widget> stackList = [];
    if (isCameraAvailable && hasCameraPermissions && hasMicrophonePermissions) {
      stackList.add(
        FutureBuilder<void>(
          future: _initializeControllerFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.done) {
              return _cameraWidget(context);
            } else {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }
          },
        ),
      );
    } else {
      if (!hasCameraPermissions || !hasMicrophonePermissions) {
        stackList.add(
          Positioned(
            right: 0.0,
            left: 0.0,
            bottom: 0.0,
            top: 0.0,
            child: _permissionsPage(),
          ),
        );
      } else {
        stackList.add(_cameraNotAvailableWidget());
      }
    }
    if (isCameraAvailable && hasCameraPermissions && hasMicrophonePermissions) {
      stackList.add(
        Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).padding.bottom + 20.0.w,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (!_isRecording.value && isShowRecordingText) ...[
                  Center(
                    child: Text(
                      _appLocalizations.createPost_pressAndHoldToRecordVideo,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: WildrColors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(
                    height: 20,
                  ),
                ],
                _mediaInteractionRow(),
              ],
            ),
          ),
        ),
      );
    }
    return stackList;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return GestureDetector(
      onDoubleTap: _flipCamera,
      child: Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        child: Stack(children: _stackChildren()),
      ),
    );
  }

  void _pushRoute(String imageOrVideoPath, {bool isVideo = false}) {
    context
        .pushRoute(
      PreviewAndCropMediaPostRoute(
        createPostGxC: widget.createPostGxC,
        imageOrVideoPath: imageOrVideoPath,
        isVideo: isVideo,
      ),
    )
        .then((value) {
      if (value == SHOULD_CALL_SET_STATE) {
        setState(() {});
      } else if (value == POP_CURRENT_PAGE) {
        Common().mainBloc(context).add(CloseCreatePostPageEvent());
        Navigator.of(context).pop();
        return;
      } else if (value == ADD_ANOTHER_POST) {
        widget.createPostGxC.animateCounter.value = true;
        widget.createPostGxC.opacityEnabled.value = false;
      } else if (value == OPEN_UPLOAD_PAGE) {
        context
            .pushRoute(
          UploadMultiMediaPostV2Route(
            createPostGxC: widget.createPostGxC,
            defaultSelectedChallenge: widget.defaultSelectedChallenge,
          ),
        )
            .then((value) {
          if (value == SHOULD_CALL_SET_STATE) {
            setState(() {});
          } else if (value == POP_CURRENT_PAGE) {
            Common().mainBloc(context).add(CloseCreatePostPageEvent());
          } else if (value == ADD_ANOTHER_POST) {
            widget.createPostGxC.animateCounter.value = true;
            widget.createPostGxC.opacityEnabled.value = false;
          }
        });
      }
      _initCamera(cameras[0]);
    });
  }

  Future<void> _selectImage() async {
    Navigator.of(context).pop();

    final cameraStatus = await Permission.photos.status;
    if (cameraStatus.isPermanentlyDenied) {
      Common().showPhotosPermissionDeniedDialog(context);
      return;
    }

    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      _pushRoute(pickedFile.path);
    }
  }

  Future<void> _selectVideo() async {
    Navigator.of(context).pop(); //popping action sheet

    final cameraStatus = await Permission.photos.status;
    if (cameraStatus.isPermanentlyDenied) {
      Common().showPhotosPermissionDeniedDialog(context);
      return;
    }

    final pickedFile = await ImagePicker().pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(seconds: 60),
    );

    if (pickedFile != null) {
      // VideoData? info = await VideoMetaInfo().getVideoInfo(pickedFile.path);
      // if (info != null) {
      //   if (info.duration != null && info.duration! > 60000) {
      //     Common().showErrorDialog(
      //       context,
      //       title: "Video Limit Exceeded",
      //       description: "Maximum video duration should be 60 seconds",
      //     );
      //     return;
      //   }
      // }
      _pushRoute(pickedFile.path, isVideo: true);
    } else {
      debugPrint('Picked file = null');
    }
  }

  Future<void> _selectMedia() async {
    await HapticFeedback.selectionClick();
    //widget.navigateToGallery();
    await Common().showActionSheet(
      context,
      [
        TextButton(
          onPressed: _selectImage,
          child: SizedBox(
            width: Get.width,
            child: Text(
              _appLocalizations.createPost_image,
              textAlign: TextAlign.center,
              style: Common().actionSheetTextStyle(),
            ),
          ),
        ),
        Common().actionSheetDivider(),
        TextButton(
          onPressed: _selectVideo,
          child: SizedBox(
            width: Get.width,
            child: Text(
              _appLocalizations.createPost_video,
              textAlign: TextAlign.center,
              style: Common().actionSheetTextStyle(),
            ),
          ),
        ),
        Common().actionSheetDivider(),
      ],
      // backgroundColor: Colors.transparent,
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    animationController.dispose();
    super.dispose();
  }

  Future<void> getCameraPermission({bool isOpenAppSettings = false}) async {
    if (isOpenAppSettings) {
      await openAppSettings();
      return;
    }
    if (!hasCameraPermissions || !hasMicrophonePermissions) {
      final Map<Permission, PermissionStatus> statuses = await [
        Permission.camera,
        Permission.microphone,
      ].request();
      debugPrint('Statuses = $statuses');
      statuses.forEach((permission, permissionStatus) {
        if (permissionStatus.isPermanentlyDenied) {
          isPermanentlyDenied = true;
          setState(() {});

          return;
        }
        if (permission == Permission.camera) {
          hasCameraPermissions = permissionStatus == PermissionStatus.granted;
        } else if (permission == Permission.microphone) {
          hasMicrophonePermissions =
              permissionStatus == PermissionStatus.granted;
        }
      });
      setState(() {});
      if (hasCameraPermissions && cameras.isNotEmpty) {
        await _initCamera(cameras.first);
      }
    }
  }
}

enum FlashModeEnum { AUTO, ON, OFF }

extension FlashModeParse on FlashModeEnum {
  String getIcon() {
    switch (this) {
      case FlashModeEnum.AUTO:
        return WildrIcons.autoFlashIcon;
      case FlashModeEnum.ON:
        return WildrIcons.flashOnIcon;
      case FlashModeEnum.OFF:
        return WildrIcons.flashOffIcon;
    }
  }
}
