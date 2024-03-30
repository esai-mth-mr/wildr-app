import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';

enum MentionedObjectEnum { USER, TAG, TEXT }

class MentionedObject {
  MentionedObject({
    required this.start,
    required this.end,
    required this.str,
    this.type = ESSearchType.USER,
  }) {
    initialStr = (type == ESSearchType.USER) ? '@' : '#';
  }

  String str;
  int start;
  int end;
  ESSearchType type;
  String initialStr = '';

  @override
  String toString() => 'Start: $start; End: $end; Str: $str';
}
