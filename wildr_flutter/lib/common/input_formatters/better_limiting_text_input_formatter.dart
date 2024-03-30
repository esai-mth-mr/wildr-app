import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class BetterLimitingTextInputFormatter extends TextInputFormatter {
  BetterLimitingTextInputFormatter(this.maxLength) : assert(maxLength > 0);

  final int maxLength;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (maxLength > 0 && newValue.text.length > maxLength) {
      if (oldValue.text.length == maxLength) {
        return oldValue;
      }
      return truncate(newValue, maxLength);
    }
    return newValue;
  }

  static TextEditingValue truncate(TextEditingValue value, int maxLength) {
    var newValue = '';
    if (value.text.length > maxLength) {
      var length = 0;

      value.text.characters.takeWhile((char) {
        final nbBytes = char.length;
        if (length + nbBytes <= maxLength) {
          newValue += char;
          length += nbBytes;
          return true;
        }
        return false;
      });
    }
    return TextEditingValue(
      text: newValue,
      selection: value.selection.copyWith(
        baseOffset: min(value.selection.start, newValue.length),
        extentOffset: min(value.selection.end, newValue.length),
      ),
    );
  }
}
