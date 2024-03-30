part of 'create_post_page_v1.dart';

// A screen that takes in a list of cameras and the Directory to store images.
class CameraTabV1 extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final Challenge? defaultSelectedChallenge;

  const CameraTabV1({
    required this.createPostGxC,
    this.defaultSelectedChallenge,
    super.key,
  });

  @override
  CameraTabV1State createState() => CameraTabV1State();
}

class CameraTabV1State extends State<CameraTabV1>
    with AutomaticKeepAliveClientMixin<CameraTabV1>, TickerProviderStateMixin {
  CameraController? _cameraController;
  bool isCameraAvailable = false;
  bool _hasCameraPermissions = false;
  bool _hasMicrophonePermissions = false;
  late List<CameraDescription> cameras;

  //late List<CameraDescription> _availableCameras;
  Future<void>? _initializeControllerFuture;
  late AnimationController animationController;
  late Animation animation;
  late AnimationController flipAnimationController;
  late Animation flipAnimation;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  AnimationStatus fliAnimationStatus = AnimationStatus.dismissed;
  var zoomLevel = 0.0;
  late final MainBloc _mainBloc = Common().mainBloc(context);

  FlashModeEnum _flashMode = FlashModeEnum.OFF;

  @override
  void initState() {
    super.initState();
    Permission.camera.status.then((value) {
      if (value.isGranted) {
        _hasCameraPermissions = true;
      }
      Permission.microphone.status.then((value) {
        if (value.isGranted) {
          _hasMicrophonePermissions = true;
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
            'availableCamerasError() Error: '
            '$err.code\nError Message: $err.message',
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
  bool get wantKeepAlive => true;

  // Camera
  Future<void> _initCamera(CameraDescription description) async {
    if (!_hasCameraPermissions || !_hasMicrophonePermissions) {
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
    if (_cameraController?.value.isRecordingVideo ?? false) {
      return;
    }
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

  Future<void> _stopVideoRecording({
    bool stopAnimationController = false,
  }) async {
    final video = await _cameraController!.stopVideoRecording();
    if (stopAnimationController) {
      animationController.stop();
    }
    animationController.reset();
    debugPrint(video.path);

    if (!mounted) return;

    await context
        .pushRoute(
      PreviewAndCropMediaPostRoute(
        createPostGxC: widget.createPostGxC,
        imageOrVideoPath: video.path,
        isVideo: true,
        isFromCamera: true,
      ),
    )
        .then((value) {
      if (value == SHOULD_CALL_SET_STATE) {
        setState(() {});
      } else if (value == POP_CURRENT_PAGE) {
        _mainBloc.add(CloseCreatePostPageEvent());
        Navigator.of(context).pop();
        return;
      } else if (value == ADD_ANOTHER_POST) {
        widget.createPostGxC.animateCounter.value = true;
        widget.createPostGxC.opacityEnabled.value = false;
      } else if (value == OPEN_UPLOAD_PAGE) {
        context
            .pushRoute(
          UploadMultiMediaPostV1Route(
            createPostGxC: widget.createPostGxC,
            defaultSelectedChallenge: widget.defaultSelectedChallenge,
          ),
        )
            .then((value) {
          if (value == SHOULD_CALL_SET_STATE) {
            setState(() {});
          } else if (value == POP_CURRENT_PAGE) {
            _mainBloc.add(CloseCreatePostPageEvent());
          } else if (value == ADD_ANOTHER_POST) {
            widget.createPostGxC.animateCounter.value = true;
            widget.createPostGxC.opacityEnabled.value = false;
          }
        });
      }
      _initCamera(cameras[0]);
    });
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
        _mainBloc.add(CloseCreatePostPageEvent());
        Navigator.of(context).pop();
        return;
      } else if (value == ADD_ANOTHER_POST) {
        widget.createPostGxC.animateCounter.value = true;
        widget.createPostGxC.opacityEnabled.value = false;
      } else if (value == OPEN_UPLOAD_PAGE) {
        context
            .pushRoute(
          UploadMultiMediaPostV1Route(
            createPostGxC: widget.createPostGxC,
            defaultSelectedChallenge: widget.defaultSelectedChallenge,
          ),
        )
            .then((value) {
          if (value == SHOULD_CALL_SET_STATE) {
            setState(() {});
          } else if (value == POP_CURRENT_PAGE) {
            _mainBloc.add(CloseCreatePostPageEvent());
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
    Common()
        .mainBloc(context)
        .logCustomEvent(ButtonTapEvents.kCreateV1PostPickImage);
    Navigator.of(context).pop();
    final cameraStatus = await Permission.photos.status;
    if (cameraStatus.isPermanentlyDenied) {
      Common().showPhotosPermissionDeniedDialog(context);
      return;
    }
    try {
      final pickedFile =
          await ImagePicker().pickImage(source: ImageSource.gallery);
      if (pickedFile != null) {
        _pushRoute(pickedFile.path);
      }
    } catch (exception, stack) {
      await FirebaseCrashlytics.instance.recordError(
        exception,
        stack,
        reason: ButtonTapEvents.kCreateV1PostPickImage,
      );
    }
  }

  Future<void> _selectVideo() async {
    Common()
        .mainBloc(context)
        .logCustomEvent(ButtonTapEvents.kCreateV1PostPickVideo);
    Navigator.of(context).pop(); //popping action sheet
    final cameraStatus = await Permission.photos.status;
    if (cameraStatus.isPermanentlyDenied) {
      Common().showPhotosPermissionDeniedDialog(context);
      return;
    }
    try {
      final pickedFile = await ImagePicker().pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(seconds: 60),
      );
      if (pickedFile != null) {
        _pushRoute(pickedFile.path, isVideo: true);
      } else {
        debugPrint('Picked file = null');
      }
    } catch (exception, stack) {
      await FirebaseCrashlytics.instance.recordError(
        exception,
        stack,
        reason: ButtonTapEvents.kCreateV1PostPickVideo,
      );
    }
  }

  Future<void> _selectMedia() async {
    await HapticFeedback.selectionClick();
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
      ],
    );
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
                Expanded(child: Container()),
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
                Expanded(child: Container()),
              ],
            ),
          ),
        ),
      );

  //Camera available
  Widget _permissionsPage() => Padding(
        padding: const EdgeInsets.only(bottom: 100.0),
        child: ColoredBox(
          color: Colors.black,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _appLocalizations.createPost_shareOnWildr,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16.5.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Padding(
                  padding: EdgeInsets.only(
                    top: 1.0.h,
                    bottom: 5.0.h,
                    left: 15.0.w,
                    right: 15.0.w,
                  ),
                  child: Text(
                    _appLocalizations.createPost_enableAccessPhotosVideos,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                _enableCameraAccessButton(),
                _enableMicrophoneAccessButton(),
              ],
            ),
          ),
        ),
      );

  bool _isRequestingPermissions = false;

  Widget _enableCameraAccessButton() => Opacity(
        opacity: _isRequestingPermissions ? 0.5 : 1,
        child: TextButton(
          onPressed: _hasCameraPermissions || _isRequestingPermissions
              ? null
              : () {
                  _mainBloc.logCustomEvent(
                    ButtonTapEvents.kCreateV1EnableCameraAccess,
                  );
                  _requestCameraAndMicrophonePermissions();
                },
          child: Text(
            _appLocalizations.createPost_enableCameraAccess,
            style: TextStyle(
              color: _hasCameraPermissions || _isRequestingPermissions
                  ? Colors.white70
                  : WildrColors.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );

  Widget _enableMicrophoneAccessButton() => Opacity(
        opacity: _isRequestingPermissions ? 0.5 : 1,
        child: TextButton(
          onPressed: _hasMicrophonePermissions || _isRequestingPermissions
              ? null
              : () {
                  _mainBloc.logCustomEvent(
                    ButtonTapEvents.kCreateV1EnableMicrophoneAccess,
                  );
                  _requestMicrophonePermissionsAndUpdateFlag();
                },
          child: Text(
            _appLocalizations.createPost_enableMicrophoneAccess,
            style: TextStyle(
              color: _hasMicrophonePermissions || _isRequestingPermissions
                  ? Colors.white70
                  : WildrColors.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      );

  Future<void> _requestCameraAndMicrophonePermissions() async {
    setState(() {
      _isRequestingPermissions = true;
    });
    await _requestCameraPermissionsAndUpdateFlag();
    if (!_hasCameraPermissions) {
      setState(() {
        _isRequestingPermissions = false;
      });
      return;
    }
    await _initCamera(cameras.first);
    await _requestMicrophonePermissionsAndUpdateFlag();
    setState(() {
      _isRequestingPermissions = true;
    });
  }

  Future<void> _requestCameraPermissionsAndUpdateFlag() async {
    final PermissionStatus permissionStatus = await Permission.camera.request();
    _hasCameraPermissions = _checkPermissionStatusAndOpenAppSettings(
      permissionStatus,
      openAppSettingsSnackBarMessage:
          _appLocalizations.createPost_requestCameraPermission,
    );
    setState(() {});
  }

  Future<void> _requestMicrophonePermissionsAndUpdateFlag() async {
    final permissionState = await Permission.microphone.request();
    _hasMicrophonePermissions = _checkPermissionStatusAndOpenAppSettings(
      permissionState,
      openAppSettingsSnackBarMessage:
          _appLocalizations.createPost_requestMicrophonePermission,
    );
    setState(() {});
    if (_hasCameraPermissions) {
      await _initCamera(cameras.first);
    }
  }

  bool _checkPermissionStatusAndOpenAppSettings(
    PermissionStatus permissionState, {
    required String openAppSettingsSnackBarMessage,
  }) {
    switch (permissionState) {
      case PermissionStatus.permanentlyDenied:
        Common().showSnackBar(
          context,
          openAppSettingsSnackBarMessage,
          action: SnackBarAction(
            label: _appLocalizations.comm_cap_settings,
            onPressed: openAppSettings,
            textColor: WildrColors.primaryColor,
          ),
        );
        return false;
      case PermissionStatus.granted:
      case PermissionStatus.provisional:
      case PermissionStatus.limited:
        return true;
      case PermissionStatus.restricted:
      case PermissionStatus.denied:
        return false;
    }
  }

  Widget _recordOrCaptureButton() => Container(
        width: Get.width * 0.15,
        height: Get.width * 0.15,
        decoration: BoxDecoration(
          border: Border.all(
            color: Colors.white,
          ),
          borderRadius: const BorderRadius.all(Radius.circular(100)),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Loader(animationController),
            SizedBox(
              width: Get.width * 0.14,
              height: Get.width * 0.14,
              child: Padding(
                padding: const EdgeInsets.all(5.0),
                child: GestureDetector(
                  onLongPressStart: (details) async {
                    if (_cameraController == null) return;
                    if (widget.createPostGxC.postCount == 5) {
                      await HapticFeedback.vibrate();
                      Common().showErrorSnackBar(
                        _appLocalizations.createPost_postLimitReached,
                        context,
                      );
                      return;
                    }
                    try {
                      await _cameraController!.startVideoRecording();
                      await HapticFeedback.selectionClick();
                      await animationController.forward(from: 0);
                    } catch (e) {
                      debugPrint(e.toString());
                    }
                  },
                  onLongPressEnd: (details) async {
                    debugPrint('OnLongPPressEnd');
                    if (widget.createPostGxC.postCount != 5) {
                      await _stopVideoRecording(
                        stopAnimationController:
                            animationController.isAnimating,
                      );
                    }
                  },
                  child: RawMaterialButton(
                    shape: const CircleBorder(),
                    fillColor: WildrColors.primaryColor,
                    highlightElevation: 0,
                    highlightColor: Colors.transparent,
                    onPressed: (_cameraController == null ||
                            _cameraController!.value.isRecordingVideo)
                        ? null
                        : () async {
                            if (_cameraController!.value.isRecordingVideo) {
                              return;
                            }
                            try {
                              await HapticFeedback.selectionClick();
                              context.loaderOverlay.show();
                              await _initializeControllerFuture;
                              XFile image =
                                  await _cameraController!.takePicture();
                              debugPrint(
                                'Took a picture and path is ${image.path}',
                              );
                              context.loaderOverlay.hide();
                              if (_cameraController!
                                      .description.lensDirection ==
                                  CameraLensDirection.front) {
                                final rotatedFile =
                                    await Common().fixRotation(image.path);
                                if (rotatedFile != null) image = rotatedFile;
                              }
                              if (!mounted) return;
                              await context
                                  .pushRoute(
                                PreviewAndCropMediaPostRoute(
                                  imageOrVideoPath: image.path,
                                  createPostGxC: widget.createPostGxC,
                                ),
                              )
                                  .then((value) {
                                if (value == SHOULD_CALL_SET_STATE) {
                                  setState(() {});
                                } else if (value == POP_CURRENT_PAGE) {
                                  Common()
                                      .mainBloc(context)
                                      .add(CloseCreatePostPageEvent());
                                  Navigator.of(context).pop();
                                  return;
                                } else if (value == ADD_ANOTHER_POST) {
                                  widget.createPostGxC.animateCounter.value =
                                      true;
                                  widget.createPostGxC.opacityEnabled.value =
                                      false;
                                } else if (value == OPEN_UPLOAD_PAGE) {
                                  context
                                      .pushRoute(
                                    UploadMultiMediaPostV1Route(
                                      createPostGxC: widget.createPostGxC,
                                      defaultSelectedChallenge:
                                          widget.defaultSelectedChallenge,
                                    ),
                                  )
                                      .then((value) {
                                    if (value == SHOULD_CALL_SET_STATE) {
                                      setState(() {});
                                    } else if (value == POP_CURRENT_PAGE) {
                                      Common()
                                          .mainBloc(context)
                                          .add(CloseCreatePostPageEvent());
                                    } else if (value == ADD_ANOTHER_POST) {
                                      widget.createPostGxC.animateCounter
                                          .value = true;
                                      widget.createPostGxC.opacityEnabled
                                          .value = false;
                                    }
                                  });
                                }
                                _initCamera(cameras[0]);
                              });
                            } catch (e) {
                              debugPrint(e.toString());
                            }
                          },
                  ),
                ),
              ),
            ),
          ],
        ),
      );

  Widget _mediaInteractionRow() => Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          IconButton(
            splashColor: Colors.red,
            onPressed: _selectMedia,
            icon: Icon(
              Icons.perm_media,
              color: Colors.white60,
              size: 30.0.w,
            ),
          ),
          if (_hasCameraPermissions && _hasMicrophonePermissions)
            _recordOrCaptureButton(),
          if (_hasCameraPermissions && _hasMicrophonePermissions)
            (cameras.length > 1)
                ? IconButton(
                    onPressed: _flipCamera,
                    icon: WildrIcon(
                      WildrIcons.refresh_filled,
                      color: Colors.white60,
                      size: 30.0.w,
                    ),
                  )
                : SizedBox(width: 30.0.w, height: 30.0.w),
        ],
      );

  Widget _cameraWidget(context) =>
      Common().clipIt(child: CameraPreview(_cameraController!));

  List<Widget> _stackChildren() {
    final List<Widget> stackList = [];
    if (isCameraAvailable) {
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
      if (!_hasCameraPermissions || !_hasMicrophonePermissions) {
        stackList.add(_permissionsPage());
      }
    } else {
      stackList.add(_cameraNotAvailableWidget());
    }
    if (isCameraAvailable) {
      stackList.add(
        Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).padding.bottom + Get.height * 0.1,
            ),
            child: _mediaInteractionRow(),
          ),
        ),
      );
      if (_hasCameraPermissions && _hasMicrophonePermissions) {
        stackList.add(
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).padding.bottom + 20.0.w,
                top: 20.0.h,
                right: 10.0.w,
              ),
              child: WildrIconButton(
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
            ),
          ),
        );
      }
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

  @override
  void dispose() {
    _cameraController?.dispose();
    animationController.dispose();
    super.dispose();
  }
}

enum FlashModeEnum { AUTO, ON, OFF }

extension FlashModeParse on FlashModeEnum {
  String getIcon() {
    switch (this) {
      case FlashModeEnum.AUTO:
        return WildrIcons.flash_auto_filled;
      case FlashModeEnum.ON:
        return WildrIcons.flash_on_filled;
      case FlashModeEnum.OFF:
        return WildrIcons.flash_off_filled;
    }
  }
}
