// ignore_for_file: lines_longer_than_80_chars

import 'dart:io';
import 'dart:ui';

import 'package:auto_route/auto_route.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_fgbg/flutter_fgbg.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_create_post/v1/create_post_page_v1.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/camera_permission_page.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrFaceVerificationCameraPage extends StatefulWidget {
  const WildrFaceVerificationCameraPage({super.key});

  @override
  State<WildrFaceVerificationCameraPage> createState() =>
      WildrFaceVerificationCameraPageState();
}

class WildrFaceVerificationCameraPageState
    extends State<WildrFaceVerificationCameraPage>
    with
        AutomaticKeepAliveClientMixin<WildrFaceVerificationCameraPage>,
        TickerProviderStateMixin {
  CameraController? _cameraController;
  bool isCameraAvailable = false;
  bool hasCameraPermissions = false;
  bool didOpenAppSettings = false;
  late List<CameraDescription> cameras;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  Future<void>? _initializeControllerFuture;
  late AnimationController animationController;
  FlashModeEnum _flashMode = FlashModeEnum.OFF;
  bool showOverlay = true;

  @override
  void initState() {
    super.initState();
    Permission.camera.status.then((value) {
      if (value.isGranted) {
        hasCameraPermissions = true;
        availableCameras().then((availableCameras) {
          cameras = availableCameras;
          isCameraAvailable = true;
          if (cameras.isNotEmpty) {
            // get rear camera and if it doesn't exist, get front camera
            _initCamera(
              cameras.firstWhere(
                (description) =>
                    description.lensDirection == CameraLensDirection.back,
                orElse: () => cameras.first,
              ),
            );
          } else {
            debugPrint('No camera available');
            isCameraAvailable = false;
          }
          setState(() {});
        }).catchError((err) {
          setState(() {});
          debugPrint(
            'availableCamerasError() Error: $err.code\nError Message: $err.message',
          );
        });
      }
    });

    animationController =
        AnimationController(duration: const Duration(seconds: 30), vsync: this)
          ..addListener(() {
            if (animationController.isCompleted) {}
          });
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        showOverlay = false;
      });
    });
  }

  Future<void> checkPermissionStatus() async {
    final PermissionStatus status = await Permission.camera.status;
    setState(() {
      hasCameraPermissions = status == PermissionStatus.granted ||
          status == PermissionStatus.limited ||
          status == PermissionStatus.provisional;
    });
    if (hasCameraPermissions) {
      await availableCameras().then((availableCameras) {
        cameras = availableCameras;
        setState(() {});
        if (cameras.isNotEmpty) {
          _initCamera(cameras.first);
        } else {
          debugPrint('No camera available');
          isCameraAvailable = false;
          setState(() {});
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return FGBGNotifier(
      onEvent: (event) {
        switch (event) {
          case FGBGType.foreground:
            if (didOpenAppSettings) {
              setState(() {
                didOpenAppSettings = false;
              });
              checkPermissionStatus();
            }
          case FGBGType.background:
            break;
        }
      },
      child: Scaffold(
        appBar: AppBar(
          elevation: 0,
          title: Text(
            showOverlay
                ? _appLocalizations.wildr_verify_step2Of2
                : _appLocalizations.wildr_verify_raiseYourHandAndSmileWithHand,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              fontFamily: FontFamily.satoshi,
            ),
          ),
        ),
        body: Stack(
          children: [
            Stack(children: _stackChildren()),
            if (showOverlay) _overlayItem(),
          ],
        ),
      ),
    );
  }

  Widget _overlayItem() => Positioned.fill(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
          child: ColoredBox(
            color: WildrColors.textPostBGColor(context)
                .withOpacity(0.5), // Customize overlay color
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const WildrIconPng(WildrIconsPng.handImage),
                TitleText(
                  title: _appLocalizations.wildr_verify_raiseYourHandAndSmile,
                ),
              ],
            ),
          ),
        ),
      );

  void _flipCamera() {
    debugPrint('Flip camera');
    if (_cameraController?.value.isRecordingVideo ?? false) {
      return;
    }

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

  // Camera
  Future<void> _initCamera(CameraDescription description) async {
    if (!hasCameraPermissions) {
      debugPrint("[_initCamera] Don't have permissions, thus returning");
      return;
    }

    _cameraController = CameraController(
      description,
      ResolutionPreset.high,
      imageFormatGroup: ImageFormatGroup.jpeg,
      enableAudio: false,
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

  Widget cameraNotAvailableErrorMessage() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Container(
          width: Get.width,
          height: Get.height * 0.8,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: WildrColors.gray100,
          ),
          child: Center(
            child: Column(
              children: [
                SizedBox(height: Get.height * 0.2),
                SizedBox(
                  width: Get.width * 0.2,
                  height: Get.height * 0.1,
                  child: const WildrIconPng(
                    WildrIconsPng.cameraNotAvailable,
                  ),
                ),
                SizedBox(height: Get.height * 0.02),
                const Text(
                  kCameraErrorMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: WildrColors.gray1100,
                    fontFamily: FontFamily.satoshi,
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
                SizedBox(height: Get.height * 0.01),
                const Text(
                  kCameraAccessMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: WildrColors.gray700,
                    fontFamily: FontFamily.satoshi,
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  Widget alignedCircularCameraContainer() => Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: EdgeInsets.only(bottom: Get.height * 0.15),
          child: Container(
            width: Get.width * 0.17,
            height: Get.width * 0.17,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: 4.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF000000).withOpacity(0.25),
                  offset: const Offset(1.0, 1.0),
                  blurRadius: 25.0,
                ),
              ],
            ),
          ),
        ),
      );

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
    } else if (!hasCameraPermissions) {
      stackList.add(_permissionsPage());
    } else {
      stackList
        ..add(cameraNotAvailableErrorMessage())
        ..add(alignedCircularCameraContainer());
    }
    if (isCameraAvailable) {
      stackList.add(
        Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(bottom: Get.height * 0.15),
            child: _mediaInteractionRow(),
          ),
        ),
      );
    }
    return stackList;
  }

  Widget _mediaInteractionRow() => Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          if (hasCameraPermissions)
            WildrIconButton(
              _flashMode.getIcon(),
              size: 25.0.h,
              color: _flashMode != FlashModeEnum.OFF
                  ? WildrColors.yellow
                  : Colors.white,
              onPressed: () {
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
          if (hasCameraPermissions) _recordOrCaptureButton(),
          if (hasCameraPermissions)
            (cameras.length > 1)
                ? IconButton(
                    onPressed: _flipCamera,
                    icon: WildrIcon(
                      WildrIcons.flipCameraIcon,
                      color: Colors.white,
                      size: 25.0.h,
                    ),
                  )
                : SizedBox(
                    width: 30.0.w,
                    height: 30.0.w,
                  ),
        ],
      );

  Widget _cameraWidget(context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Common().clipIt(child: CameraPreview(_cameraController!)),
      );

  Widget _recordOrCaptureButton() => SizedBox(
        width: Get.width * 0.17,
        height: Get.width * 0.17,
        child: Padding(
          padding: const EdgeInsets.all(5.0),
          child: GestureDetector(
            onTap: () async {
              context.loaderOverlay.show();
              await _initializeControllerFuture;
              XFile image = await _cameraController!.takePicture();
              if (_cameraController!.description.lensDirection ==
                  CameraLensDirection.front) {
                final rotatedFile = await Common().fixRotation(image.path);
                if (rotatedFile != null) image = rotatedFile;
              }
              debugPrint(
                'Took a picture and path is ${image.path}',
              );
              context.loaderOverlay.hide();
              await context.pushRoute(
                ReviewFaceVerificationPhotoPageRoute(
                  imageFile: File(image.path),
                ),
              );
            },
            child: SvgPicture.asset(
              WildrIcons.captureIcon,
            ),
          ),
        ),
      );

  //Camera available
  Widget _permissionsPage() => CameraPermissionPage(
        title: _appLocalizations.wildr_verify_allowWildrToAccessYourCamera,
        subTitle: _appLocalizations.createPost_postContentAccessExplanation,
        actionButtonText: _appLocalizations.createPost_enableCameraAccess,
        onActionButtonTap: hasCameraPermissions
            ? null
            : () async {
                final Map<Permission, PermissionStatus> statuses = await [
                  Permission.camera,
                ].request();
                debugPrint('Statuses = $statuses');
                statuses.forEach((permission, permissionStatus) {
                  if (permissionStatus.isPermanentlyDenied) {
                    Common().showSnackBar(
                      context,
                      _appLocalizations.createPost_requestCameraPermission,
                      action: SnackBarAction(
                        label: _appLocalizations.comm_cap_settings,
                        onPressed: () {
                          setState(() {
                            didOpenAppSettings = true;
                          });
                          openAppSettings();
                        },
                        textColor: WildrColors.primaryColor,
                      ),
                    );
                    return;
                  }
                  if (permission == Permission.camera) {
                    hasCameraPermissions =
                        permissionStatus == PermissionStatus.granted;
                  }
                });
                setState(() {});
                if (hasCameraPermissions) {
                  await availableCameras().then((availableCameras) {
                    cameras = availableCameras;
                    setState(() {});
                    if (cameras.isNotEmpty) {
                      _initCamera(cameras.first);
                    } else {
                      debugPrint('No camera available');
                      isCameraAvailable = false;
                    }
                  });
                }
              },
      );

  @override
  bool get wantKeepAlive => true;
}
