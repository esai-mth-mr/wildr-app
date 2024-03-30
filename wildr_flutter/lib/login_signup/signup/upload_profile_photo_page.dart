import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:camera/camera.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_fgbg/flutter_fgbg.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/svg.dart';
import 'package:get/get.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon_button.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_create_post/v2/create_post_page_v2.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/camera_permission_page.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('UploadProfilePhotoPage: $message');
}

class UploadProfilePhotoPage extends StatefulWidget {
  final void Function(File imagePath) onProfilePhotoSaved;

  const UploadProfilePhotoPage({
    super.key,
    required this.onProfilePhotoSaved,
  });

  @override
  State<UploadProfilePhotoPage> createState() => _UploadProfilePhotoPageState();
}

/// Check [availableCameras] and assign to [_cameras]
/// if [_cameras] is empty, then show [CameraNotAvailable] widget
/// return;
/// if has camera, then check for [Permission.camera] status
/// if has permissions, then [_initCamera] camera
/// else show [_permissionsPage], which shows [CameraPermissionPage]
class _UploadProfilePhotoPageState extends State<UploadProfilePhotoPage>
    with TickerProviderStateMixin {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  List<CameraDescription> _cameras = [];
  CameraController? _cameraController;
  bool _isCameraAvailable = false;
  bool _hasCameraPermissions = false;
  bool _hasPermanentlyDeniedPermissions = false;
  Future<void>? _initializeControllerFuture;
  FlashModeEnum _flashMode = FlashModeEnum.OFF;
  bool _isInitializing = true;
  bool _isProcessingImage = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _init();
    });
  }

  void _init() {
    availableCameras().then((value) {
      _cameras = value;
      _isCameraAvailable = _cameras.isNotEmpty;
      if (_isCameraAvailable) _requestForCameraPermissionsAndInitCamera();
    });
  }

  CameraDescription _getFrontCamera() {
    for (final camera in _cameras) {
      if (camera.lensDirection == CameraLensDirection.front) {
        return camera;
      }
    }
    return _cameras.first;
  }

  void _requestForCameraPermissionsAndInitCamera() {
    Permission.camera.request().then((PermissionStatus permissionsStats) {
      setState(() {
        _isInitializing = false;
      });
      if (permissionsStats.isGranted) {
        print('Granted');
        _hasCameraPermissions = true;
        _initCamera(_getFrontCamera());
        return;
      } else if (permissionsStats.isPermanentlyDenied) {
        _hasPermanentlyDeniedPermissions = true;
        setState(() {});
        return;
      } else {
        Common().showSnackBar(
          context,
          _appLocalizations.comm_cameraPermissionRequest,
          action: SnackBarAction(
            label: _appLocalizations.comm_cap_settings,
            onPressed: openAppSettings,
            textColor: WildrColors.primaryColor,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) => FGBGNotifier(
        onEvent: (event) {
          if (event == FGBGType.foreground) {
            _init();
          }
        },
        child: Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
          ),
          body: GestureDetector(
            onDoubleTap: _flipCamera,
            child: _body(),
          ),
        ),
      );

  Future<void> _flipCamera() async {
    debugPrint('Flip camera');
    if (_cameraController == null) return;
    final lensDirection = _cameraController!.description.lensDirection;
    CameraDescription newDescription;
    if (lensDirection == CameraLensDirection.front) {
      newDescription = _cameras.firstWhere(
        (description) => description.lensDirection == CameraLensDirection.back,
      );
    } else {
      newDescription = _cameras.firstWhere(
        (description) => description.lensDirection == CameraLensDirection.front,
      );
    }
    await _initCamera(newDescription);
  }

  Widget _body() {
    if (_isInitializing) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (!_hasCameraPermissions) return _permissionsPage();

    if (!_isCameraAvailable || _cameraController == null) {
      return _CameraNotAvailable(selectImage: _selectImageAndPop);
    }

    return SizedBox(
      height: _cameraController!.value.previewSize?.height ?? Get.height,
      width: _cameraController!.value.previewSize?.width ?? Get.width,
      child: Stack(
        children: [
          FutureBuilder<void>(
            future: _initializeControllerFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.done) {
                return Center(child: _cameraWidget());
              } else {
                return const Center(
                  child: CircularProgressIndicator(),
                );
              }
            },
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).padding.bottom + 20.0.w,
              ),
              child: _isProcessingImage
                  ? const CupertinoActivityIndicator(
                      radius: 25,
                      color: WildrColors.white,
                    )
                  : _mediaInteractionRow(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _cameraWidget() => CameraPreview(_cameraController!);

  Widget _mediaInteractionRow() => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),
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
          const Spacer(),
          _captureButton(),
          const Spacer(),
          if (_cameras.length > 1)
            WildrIconButton(
              WildrIcons.flipCameraIcon,
              onPressed: _flipCamera,
              color: Colors.white,
              size: 25.0.h,
            )
          else
            SizedBox(width: 25.0.h, height: 25.0.h),
          const Spacer(),
        ],
      );

  Widget _captureButton() => SizedBox(
        width: Get.width * 0.17,
        height: Get.width * 0.17,
        child: GestureDetector(
          onTap: () async {
            try {
              await HapticFeedback.selectionClick();
              setState(() {
                _isProcessingImage = true;
              });
              var image = await _cameraController!.takePicture();
              debugPrint(
                'Took a picture and path is ${image.path}',
              );
              context.loaderOverlay.hide();
              if (_cameraController!.description.lensDirection ==
                  CameraLensDirection.front) {
                final rotatedFile = await Common().fixRotation(image.path);
                if (rotatedFile != null) image = rotatedFile;
              }

              if (!mounted) return;
              final compressedImage = await _compressAndUpdateImage(image.path);
              if (mounted) {
                setState(() {
                  _isProcessingImage = false;
                });
              }
              if (compressedImage != null) {
                widget.onProfilePhotoSaved(compressedImage);
                await context.popRoute();
              }
            } catch (e) {
              debugPrint(e.toString());
            }
          },
          child: SvgPicture.asset(WildrIcons.captureIcon),
        ),
      );

  void _selectImageAndPop() async {
    final cameraStatus = await Permission.photos.status;
    if (cameraStatus.isPermanentlyDenied) {
      Common().showPhotosPermissionDeniedDialog(context);
      return;
    }
    final pickedFile =
        await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final croppedFile = await _compressAndUpdateImage(pickedFile.path);
      if (croppedFile != null) {
        print('Cropped file not null');
        widget.onProfilePhotoSaved(croppedFile);
        await context.popRoute();
        return;
      }
    }
  }

  Future<File?> _compressAndUpdateImage(String path) async {
    debugPrint('_cropAndAttachImage $path');
    final CroppedFile? croppedFile = await ImageCropper().cropImage(
      sourcePath: path,
      cropStyle: CropStyle.circle,
      aspectRatioPresets: [CropAspectRatioPreset.square],
    );
    if (croppedFile == null) return null;
    final List<File> files =
        await Common().generateThumbnailAndCompressImageToFiles(
      croppedFile.path,
      onlyThumbnail: true,
    );
    return files.isNotEmpty ? files[0] : null;
  }

  Widget _permissionsPage() => _hasPermanentlyDeniedPermissions
      ? const Center(child: _PermanentlyDeniedPermissionsPage())
      : CameraPermissionPage(
          title: _appLocalizations.uploadProfilePhoto_cameraAccessRequest,
          subTitle: _appLocalizations
              .uploadProfilePhoto_postProfilePictureExplanation,
          actionButtonText: _appLocalizations.uploadProfilePhoto_enableCamera,
          onActionButtonTap: _requestForCameraPermissionsAndInitCamera,
        );

  Future<void> _initCamera(CameraDescription description) async {
    if (!_hasCameraPermissions) {
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
      await _cameraController!.lockCaptureOrientation(
        DeviceOrientation.portraitUp,
      );
      setState(() {
        _isCameraAvailable = true;
      });
    } catch (e) {
      debugPrint('Camera controller initialization failed');
      debugPrint(e.toString());
      Common().showErrorSnackBar(
        _appLocalizations.wildr_verify_enablePhotoPermissionsInstruction,
        context,
      );
      setState(() {
        _isCameraAvailable = false;
      });
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }
}

class _CameraNotAvailable extends StatelessWidget {
  const _CameraNotAvailable({required this.selectImage});

  final VoidCallback selectImage;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: selectImage,
        child: ColoredBox(
          color: const Color(0xBF000000),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Expanded(
                  child: SizedBox.shrink(),
                ),
                Center(
                  child: Text(
                    AppLocalizations.of(context)!.createPost_cameraNotAvailable,
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
                const Expanded(
                  child: SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      );
}

class _PermanentlyDeniedPermissionsPage extends StatelessWidget {
  const _PermanentlyDeniedPermissionsPage();

  @override
  Widget build(BuildContext context) {
    final appLocalizations = AppLocalizations.of(context)!;
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          appLocalizations.uploadProfilePhoto_cameraAccessRequired,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            fontFamily: FontFamily.slussenExpanded,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          appLocalizations.uploadProfilePhoto_cameraAccessPermissionMessage,
          style: const TextStyle(
            color: WildrColors.gray500,
            fontWeight: FontWeight.w500,
            fontSize: 16,
            fontFamily: FontFamily.satoshi,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: openAppSettings,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
                side: BorderSide(color: WildrColors.appBarTextColor(context)),
              ),
            ),
            child: Text(
              appLocalizations.comm_cap_settings,
              style: const TextStyle(
                color: WildrColors.white,
                fontFamily: FontFamily.inter,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
