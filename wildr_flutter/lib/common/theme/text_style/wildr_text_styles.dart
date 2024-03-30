import 'package:flutter/material.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';

mixin WildrTextStyles {
  static const p2Medium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    fontFamily: FontFamily.satoshi,
    height: 1.5,
  );

  static const p3Medium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    fontFamily: FontFamily.satoshi,
    height: 1.5,
  );


  static const p4Medium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    fontFamily: FontFamily.satoshi,
    height: 1.5,
  );

  static const p3Semibold = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    fontFamily: FontFamily.satoshi,
    height: 1.5,
  );
}

extension WildrTextStyleExtension on TextStyle {
  TextStyle withColor(Color color) => copyWith(color: color);
}
