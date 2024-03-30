import 'package:flutter/widgets.dart';

extension StringNullCheck on String? {
  bool isNullOrEmpty() {
    if (this == null) {
      return true;
    }
    if (this!.isEmpty) {
      return true;
    }
    return false;
  }
}

extension MediaQueryHeightExcludingVerticalPadding on MediaQueryData {
  double? heightExcludingVerticalPadding() =>
      size.height - padding.top - padding.bottom;
}
