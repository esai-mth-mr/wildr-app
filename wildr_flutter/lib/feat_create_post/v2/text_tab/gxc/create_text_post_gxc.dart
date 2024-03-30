import 'package:get/get.dart';

class CreateTextPostGetController extends GetxController {
  final RxBool _isLoading = false.obs;

  bool get isLoading => _isLoading.value;

  set isLoading(bool value) => _isLoading.value = value;

  final _wordCount = 0.obs;

  int get wordCount => _wordCount.value;

  set wordCount(int value) => _wordCount.value = value;

  final _charCount = 0.obs;

  int get charCount => _charCount.value;

  set charCount(int value) => _charCount.value = value;

  void clear() {
    isLoading = false;
    wordCount = 0;
    charCount = 0;
  }
}
