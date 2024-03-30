import 'dart:io';

import 'package:get/get.dart';

class WildrVerifyGxC extends GetxController {
  File? _faceImageFile;
  File? _manualProfileImageFile;

  void saveFaceFile(File file) {
    _faceImageFile = file;
    update();
  }

  void saveManualFile(File file) {
    _manualProfileImageFile = file;
    update();
  }

  File? get getFaceFile => _faceImageFile;
  File? get getManualFile => _manualProfileImageFile;
}
