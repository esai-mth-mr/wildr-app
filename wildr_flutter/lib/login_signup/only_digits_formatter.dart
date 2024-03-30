import 'package:flutter/services.dart';

class OnlyDigitsFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final regexp = RegExp(r'[^0-9]');

    if (regexp.hasMatch(newValue.text)) {
      return oldValue;
    }
    return newValue;
  }
}
