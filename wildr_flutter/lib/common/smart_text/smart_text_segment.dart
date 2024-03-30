import 'package:wildr_flutter/constants/constants.dart';

class Segment {
  late int type; //1 = TEXT, 2 = USER, 3 = TAG
  late String displayText;
  String? id;
  bool hasOnlyText = true;

  Segment() {
    type = 0;
    displayText = '';
  }

  Segment.fromJson(Map<String, dynamic> json) {
    final String type = json['__typename'] ?? 'Text';
    if (type == 'User') {
      hasOnlyText = false;
      this.type = 2;
      displayText = "@${json['handle'] ?? kNA}";
      id = json['id'] ?? kNA;
      // noSpace = (json['noSpace'] ?? false);
    } else if (type == 'Tag') {
      hasOnlyText = false;
      this.type = 3;
      displayText = "#${json['name'] ?? kNA}";
      id = json['id'] ?? kNA;
    } else {
      this.type = 1;
      displayText = json['chunk'] ?? kNA;
    }
    // displayText = displayText.trim();
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      '__typename': getTypenameFromType(type),
      'chunk': type == 1 ? displayText : null,
      'handle': type == 2 ? displayText.substring(1) : null,
      'name': type == 3 ? displayText.substring(1) : null,
      'id': id,
    };

    return data;
  }

  String getTypenameFromType(int type) {
    if (type == 2) {
      return 'User';
    } else if (type == 3) {
      return 'Tag';
    } else {
      return 'Text';
    }
  }

  @override
  String toString() => displayText;
}
