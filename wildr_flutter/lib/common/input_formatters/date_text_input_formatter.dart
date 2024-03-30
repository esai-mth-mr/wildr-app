import 'package:flutter/services.dart';

/// [src](https://stackoverflow.com/a/65156061)
/// Automatically enters '/' when user types date.
class DateTextInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (oldValue.text.length >= newValue.text.length) {
      return newValue;
    }
    final dateText = _addSeparator(newValue.text, '/');
    return newValue.copyWith(
      text: dateText,
      selection: updateCursorPosition(dateText),
    );
  }

  String _addSeparator(String v, String separator) {
    final String value = v.replaceAll('/', '');
    var newString = '';
    for (int i = 0; i < value.length; i++) {
      newString += value[i];
      if (i == 1) {
        newString += separator;
      }
      if (i == 3) {
        newString += separator;
      }
    }
    return newString;
  }

  TextSelection updateCursorPosition(String text) =>
      TextSelection.fromPosition(TextPosition(offset: text.length));
}
