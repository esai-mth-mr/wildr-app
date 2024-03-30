import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class InputDecorations {
  static TextStyle labelStyleBright = TextStyle(
    fontSize: 17.0.sp,
    fontWeight: FontWeight.w600,
    color: Colors.black87,
  );

  static TextStyle hintStyleBright = TextStyle(
    fontSize: 17.0.sp,
  );

  static TextStyle labelStyleDark = TextStyle(
    fontSize: 17.0.sp,
    fontWeight: FontWeight.w600,
    color: Colors.white,
  );

  static TextStyle hintStyleDark = TextStyle(
    color: Colors.white,
    fontSize: 17.0.sp,
  );

  static TextStyle errorStyle = const TextStyle(color: Colors.redAccent);

  static InputDecoration denseDecoration(
    String labelText, {
    String? errorText,
    Widget? suffix,
    Widget? suffixIcon,
  }) {
    if (Get.theme.brightness == Brightness.light) {
      return denseDecorationBright(
        labelText: labelText,
        errorText: errorText,
        suffix: suffix,
        suffixIcon: suffixIcon,
      );
    } else {
      return denseDecorationDark(
        labelText: labelText,
        errorText: errorText,
        suffix: suffix,
        suffixIcon: suffixIcon,
      );
    }
  }

  static InputDecoration denseDecorationBright({
    String? labelText,
    String? errorText,
    Widget? suffix,
    Widget? suffixIcon,
  }) =>
      InputDecoration(
        labelText: labelText,
        suffixIcon: suffixIcon,
        suffix: suffix,
        errorText: errorText?.isEmpty ?? false ? null : errorText,
        isDense: true,
        hintStyle: hintStyleBright,
        labelStyle: labelStyleBright,
        helperStyle: hintStyleBright,
      );

  static InputDecoration denseDecorationDark({
    String? labelText,
    String? errorText,
    Widget? suffix,
    Widget? suffixIcon,
  }) =>
      InputDecoration(
        labelText: labelText,
        errorStyle: errorStyle,
        suffix: suffix,
        suffixIcon: suffixIcon,
        errorText: errorText?.isEmpty ?? false ? null : errorText,
        isDense: true,
        hintStyle: hintStyleDark,
        labelStyle: labelStyleDark,
        helperStyle: hintStyleDark,
        // focusedBorder:
        //     UnderlineInputBorder(borderSide:
        //     new BorderSide(color: Colors.white)),
      );
}
