import 'dart:io';
import 'package:characters/characters.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Check if any string constant is more than 40 characters long',
      () async {
    const String path = 'lib/analytics/analytics_events.dart';
    final String dartCode = await File(path).readAsString();

    final RegExp exp = RegExp(r"'(.*?)'");
    final Iterable<RegExpMatch> matches = exp.allMatches(dartCode);

    for (final RegExpMatch match in matches) {
      final String group = match.group(1)!;
      if (group.characters.length > 40) {
        fail('❌ [$group] is more than 40 characters.');
      }
    }
  });
}
