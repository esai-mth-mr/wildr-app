import 'package:flutter/foundation.dart';
import 'package:image_cropper/image_cropper.dart';

class ProfileImageCropper {
  static Future<CroppedFile?> cropImage(String path) async {
    debugPrint('_cropAndAttachImage $path');
    final CroppedFile? croppedFile = await ImageCropper().cropImage(
      sourcePath: path,
      cropStyle: CropStyle.circle,
      aspectRatioPresets: [
        CropAspectRatioPreset.square,
      ],
    );
    return croppedFile;
  }
}
