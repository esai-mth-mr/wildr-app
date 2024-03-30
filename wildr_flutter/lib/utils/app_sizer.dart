// ignore_for_file: prefer_expression_function_bodies

import 'package:get/get.dart';

const double _referenceScreenHeight = 667;
const double _referenceScreenWidth = 375;
const cells = 100;

extension AppSizer on double {
  /// for height
  double get h {
    // print("Density "+Get.pixelRatio.toString());
    final screenHeight = Get.height;
    final h = (screenHeight * this) / _referenceScreenHeight;
    return h.ceilToDouble();
  }

  /// for widget
  double get w {
    final screenWidth = Get.width;
    final w = (screenWidth * this) / _referenceScreenWidth;
    return w.ceilToDouble();
  }

  /// for fonts
  double get sp => w;

  /// radius
  double get r => w;

  /// all sides, used for EdgeInsets.all(10.0.wh)
  /// radius
  double get wh => w;
}
