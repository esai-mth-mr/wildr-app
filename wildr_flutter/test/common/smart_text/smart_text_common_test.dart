import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';

void main() {
  debugPrint = (message, {wrapWidth}) {};
  group('findMatchesFromMentionsInputControllerData', () {
    test('Finds matches with #id+<content>+di# format', () {
      const data = '#id+123+di#';
      final matches =
          SmartTextCommon().findMatchesFromMentionsInputControllerData(data);
      expect(matches.length, 1);
      expect(matches.first.group(1), '123');
    });

    test('Finds matches with @id+<content>+di@ format', () {
      const data = '@id+abc+di@';
      final matches =
      SmartTextCommon().findMatchesFromMentionsInputControllerData(data);
      expect(matches.length, 1);
      expect(matches.first.group(2), 'abc');
    });

    test('Finds matches with #<content> format', () {
      const data = '#hello';
      final matches =
      SmartTextCommon().findMatchesFromMentionsInputControllerData(data);
      expect(matches.length, 1);
      expect(matches.first.group(3), 'hello');
    });

    test('Finds matches with ^^ symbols', () {
      const data = '^^@user';
      final matches =
          SmartTextCommon().findMatchesFromMentionsInputControllerData(data);
      expect(matches.length, 3);
      expect(matches.first.group(0), '^^');
    });
  });

  group('SmartTextCommon().createContent @User', () {
    final List<TestInputOutput> testCases = [
      TestInputOutput(
        input: 'hello @id+LbtbKs-8mzQiTrXf+di@ something',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'TEXT'},
              {'position': 2, 'segmentType': 'USER'},
              {'position': 3, 'segmentType': 'TEXT'},
              {'position': 4, 'segmentType': 'TEXT'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'hello', 'noSpace': false},
              },
              {
                'position': 1,
                'text': {'chunk': ' ', 'noSpace': false},
              },
              {
                'position': 3,
                'text': {'chunk': ' ', 'noSpace': false},
              },
              {
                'position': 4,
                'text': {'chunk': 'something', 'noSpace': false},
              }
            ],
            'userSegments': [
              {'position': 2, 'userId': 'LbtbKs-8mzQiTrXf'},
            ],
            'tagSegments': [],
          },
        },
      ),
      TestInputOutput(
        input: 'hello@id+LbtbKs-8mzQiTrXf+di@something',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'USER'},
              {'position': 2, 'segmentType': 'TEXT'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'hello', 'noSpace': false},
              },
              {
                'position': 2,
                'text': {'chunk': 'something', 'noSpace': false},
              }
            ],
            'userSegments': [
              {'position': 1, 'userId': 'LbtbKs-8mzQiTrXf'},
            ],
            'tagSegments': [],
          },
        },
      ),
      TestInputOutput(
        input: 'one #two@three#four#five #six @seven@id+LbtbKs-8mzQiTrXf+di@ ',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'}, //one
              {'position': 1, 'segmentType': 'TEXT'}, //' '
              {'position': 2, 'segmentType': 'TAG'}, //#two
              {'position': 3, 'segmentType': 'TEXT'}, //@
              {'position': 4, 'segmentType': 'TEXT'}, //three
              {'position': 5, 'segmentType': 'TAG'}, //#four
              {'position': 6, 'segmentType': 'TAG'}, //#five
              {'position': 7, 'segmentType': 'TEXT'}, //' '
              {'position': 8, 'segmentType': 'TAG'}, //#six
              {'position': 9, 'segmentType': 'TEXT'}, //' '
              {'position': 10, 'segmentType': 'TEXT'}, //@
              {'position': 11, 'segmentType': 'TEXT'}, //seven
              {'position': 12, 'segmentType': 'USER'}, //LbtbKs-8mzQiTrXf
              {'position': 13, 'segmentType': 'TEXT'}, //' '
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'one', 'noSpace': false},
              },
              {
                'position': 1,
                'text': {'chunk': ' ', 'noSpace': false},
              },
              {
                'position': 3,
                'text': {'chunk': '@', 'noSpace': false},
              },
              {
                'position': 4,
                'text': {'chunk': 'three', 'noSpace': false},
              },
              {
                'position': 7,
                'text': {'chunk': ' ', 'noSpace': false},
              },
              {
                'position': 9,
                'text': {'chunk': ' ', 'noSpace': false},
              },
              {
                'position': 10,
                'text': {'chunk': '@', 'noSpace': false},
              },
              {
                'position': 11,
                'text': {'chunk': 'seven', 'noSpace': false},
              },
              {
                'position': 13,
                'text': {'chunk': ' ', 'noSpace': false},
              },
            ],
            'userSegments': [
              {'position': 12, 'userId': 'LbtbKs-8mzQiTrXf'},
            ],
            'tagSegments': [
              {
                'position': 2,
                'tag': {'name': 'two', 'noSpace': false},
              },
              {
                'position': 5,
                'tag': {'name': 'four', 'noSpace': false},
              },
              {
                'position': 6,
                'tag': {'name': 'five', 'noSpace': false},
              },
              {
                'position': 8,
                'tag': {'name': 'six', 'noSpace': false},
              },
            ],
          },
        },
      ),
    ];
    for (final e in testCases) {
      {
        test(e.input, () {
          expect(
            SmartTextCommon().createContentForSubmission(e.input),
            e.output,
          );
        });
      }
    }
  });
  group('SmartTextCommon().createContent #tag', () {
    final List<TestInputOutput> testCases = [
      TestInputOutput(
        input: 'asdasd',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'asdasd', 'noSpace': false},
              }
            ],
            'userSegments': [],
            'tagSegments': [],
          },
        },
      ),
      TestInputOutput(
        input: 'ho🙄#lecturerperks',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'TAG'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'ho🙄', 'noSpace': false},
              },
            ],
            'userSegments': [],
            'tagSegments': [
              {
                'position': 1,
                'tag': {'name': 'lecturerperks', 'noSpace': false},
              }
            ],
          },
        },
      ),
      TestInputOutput(
        input: 's!🤣#Random',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'TAG'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 's!🤣', 'noSpace': false},
              }
            ],
            'userSegments': [],
            'tagSegments': [
              {
                'position': 1,
                'tag': {'name': 'Random', 'noSpace': false},
              }
            ],
          },
        },
      ),
      TestInputOutput(
        input: '##hello',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'TAG'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': '#', 'noSpace': false},
              }
            ],
            'userSegments': [],
            'tagSegments': [
              {
                'position': 1,
                'tag': {'name': 'hello', 'noSpace': false},
              }
            ],
          },
        },
      ),
      TestInputOutput(
        input: 'bathukamma💐#love',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'TAG'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'bathukamma💐', 'noSpace': false},
              }
            ],
            'userSegments': [],
            'tagSegments': [
              {
                'position': 1,
                'tag': {'name': 'love', 'noSpace': false},
              }
            ],
          },
        },
      ),
      TestInputOutput(
        input: 'Geeta#Chalisa#Day31#BG15v10',
        output: {
          'content': {
            'segments': [
              {'position': 0, 'segmentType': 'TEXT'},
              {'position': 1, 'segmentType': 'TAG'},
              {'position': 2, 'segmentType': 'TAG'},
              {'position': 3, 'segmentType': 'TAG'},
            ],
            'textSegments': [
              {
                'position': 0,
                'text': {'chunk': 'Geeta', 'noSpace': false},
              }
            ],
            'userSegments': [],
            'tagSegments': [
              {
                'position': 1,
                'tag': {'name': 'Chalisa', 'noSpace': false},
              },
              {
                'position': 2,
                'tag': {'name': 'Day31', 'noSpace': false},
              },
              {
                'position': 3,
                'tag': {'name': 'BG15v10', 'noSpace': false},
              }
            ],
          },
        },
      ),
    ];
    for (final e in testCases) {
      {
        test(e.input, () {
          expect(
            SmartTextCommon().createContentForSubmission(e.input),
            e.output,
          );
        });
      }
    }
  });

  group('Test Regex', () {
    final List<TestInputOutput> testCases = [
      TestInputOutput(
        input: r'''
  Hi @id+LbtbKs-8mzQiTrXf+di@ @id+LbtbKs-8mzQiTrXf+di@#id+LbtbKs-8mzQiTrXf+di##nice okay@okad ggbu 


dasd.                          daokd @okd asd

  ''',
        output: [
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': 'Hi', 'groupNum': 4},
          {'text': ' ', 'groupNum': 6},
          {'text': 'LbtbKs-8mzQiTrXf', 'groupNum': 2},
          {'text': ' ', 'groupNum': 6},
          {'text': 'LbtbKs-8mzQiTrXf', 'groupNum': 2},
          {'text': 'LbtbKs-8mzQiTrXf', 'groupNum': 1},
          {'text': 'nice', 'groupNum': 3},
          {'text': ' ', 'groupNum': 6},
          {'text': 'okay', 'groupNum': 4},
          {'text': '@', 'groupNum': 7},
          {'text': 'okad', 'groupNum': 4},
          {'text': ' ', 'groupNum': 6},
          {'text': 'ggbu', 'groupNum': 4},
          {'text': ' ', 'groupNum': 6},
          {'text': '\n', 'groupNum': 5},
          {'text': '\n', 'groupNum': 5},
          {'text': '\n', 'groupNum': 5},
          {'text': 'dasd.', 'groupNum': 4},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
          {'text': 'daokd', 'groupNum': 4},
          {'text': ' ', 'groupNum': 6},
          {'text': '@', 'groupNum': 7},
          {'text': 'okd', 'groupNum': 4},
          {'text': ' ', 'groupNum': 6},
          {'text': 'asd', 'groupNum': 4},
          {'text': '\n', 'groupNum': 5},
          {'text': '\n', 'groupNum': 5},
          {'text': ' ', 'groupNum': 6},
          {'text': ' ', 'groupNum': 6},
        ],
      ),
    ];
    for (final e in testCases) {
      {
        test(e.input, () {
          final Iterable<RegExpMatch> matches = SmartTextCommon()
              .findMatchesFromMentionsInputControllerData(e.input);
          final output = [];
          for (final match in matches) {
            for (final e in List<int>.generate(7, (i) => i + 1)) {
              if (match.group(e) != null) {
                output.add({'text': match.group(e), 'groupNum': e});
              }
            }
          }
          expect(output, e.output);
        });
      }
    }
  });
}

class TestInputOutput {
  dynamic input;
  dynamic output;

  TestInputOutput({this.input, this.output});
}
