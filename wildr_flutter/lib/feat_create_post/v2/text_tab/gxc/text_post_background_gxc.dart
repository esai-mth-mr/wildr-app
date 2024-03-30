import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

enum TextPostBackgroundType { GRADIENT, CUSTOM }

List<Color> defaultTextPostBGGradientColors() => [
    WildrColors.textPostBGColor(Get.context),
    WildrColors.textPostBGColor(Get.context),
  ];

class TextPostBackgroundGxc extends GetxController {
  final RxList<Color> textPostBGColorGradient =
      defaultTextPostBGGradientColors().obs;
  set textPostBGColorGradient(List<Color> value) =>
      textPostBGColorGradient.value = value;

  final Rx<Color> _textPostCustomBGColor = Colors.transparent.obs;
  Color get textPostCustomBGColor => _textPostCustomBGColor.value;
  set textPostCustomBGColor(Color value) =>
      _textPostCustomBGColor.value = value;

  final Rx<TextPostBackgroundType> _textPostBGEnum =
      TextPostBackgroundType.GRADIENT.obs;
  TextPostBackgroundType get textPostBGEnum => _textPostBGEnum.value;
  set textPostBGEnum(TextPostBackgroundType value) =>
      _textPostBGEnum.value = value;

  void clear() {
    textPostBGColorGradient = defaultTextPostBGGradientColors();
    textPostCustomBGColor = Colors.transparent;
    textPostBGEnum = TextPostBackgroundType.GRADIENT;
  }
}
