import 'package:get/get.dart';

class DraftGxC extends GetxController {
  final RxList<int> selectedIndices = <int>[].obs;
  final Rx<bool> _isEditing = false.obs;

  bool get isEditing => _isEditing.value;
  set isEditing(bool value) => _isEditing.value = value;

  // ignore: avoid_setters_without_getters
  set selectedIndicesValue(List<int> value) => selectedIndices.value = value;

  void clearAll() {
    isEditing = false;
    selectedIndicesValue = [];
  }
}
