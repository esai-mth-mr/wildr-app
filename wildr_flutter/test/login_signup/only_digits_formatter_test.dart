import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/login_signup/only_digits_formatter.dart';

void main() {
  final formatter = OnlyDigitsFormatter();

  group('BlockCommaDotFormatter Tests', () {
    test('should allow text without comma or dot', () {
      const oldValue = TextEditingValue.empty;
      const newValue = TextEditingValue(text: '123456');

      expect(formatter.formatEditUpdate(oldValue, newValue), newValue);
    });

    test('should block text input with comma', () {
      const oldValue = TextEditingValue(text: '123');
      const newValue = TextEditingValue(text: '123,');

      expect(formatter.formatEditUpdate(oldValue, newValue), oldValue);
    });

    test('should block text input with dot', () {
      const oldValue = TextEditingValue(text: '123');
      const newValue = TextEditingValue(text: '123.');

      expect(formatter.formatEditUpdate(oldValue, newValue), oldValue);
    });

    test('should allow text after removing comma or dot', () {
      const oldValue = TextEditingValue(text: '123,');
      const newValue = TextEditingValue(text: '123');

      expect(formatter.formatEditUpdate(oldValue, newValue), newValue);
    });
  });
}
