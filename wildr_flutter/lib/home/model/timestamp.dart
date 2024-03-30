import 'dart:core';

import 'package:timeago/timeago.dart' as timeago;

class TimeStamp {
  String? _createdAt = '';
  String? _updatedAt = '';
  String? _expiry;
  String? _start;
  double? expiryPercentage;

  Map<String, dynamic> toJson() => {
      'createdAt': _createdAt,
      'updatedAt': _updatedAt,
      '_expirty': _expiry,
      '_start': _start,
    };

  TimeStamp() {
    _createdAt = '';
    _updatedAt = '';
  }

  TimeStamp.fromJson(Map<String, dynamic>? ts) {
    if (ts == null) {
      return;
    }
    _createdAt = ts['createdAt'];
    _updatedAt = ts['updatedAt'];
    _expiry = ts['expiry'];
    if (_expiry != null && _createdAt != null) {
      final DateTime createdAt = DateTime.parse(_createdAt!);
      final DateTime expiredOn = expiry!;
      final result = (DateTime.now().millisecondsSinceEpoch -
              createdAt.millisecondsSinceEpoch) /
          (expiredOn.millisecondsSinceEpoch - createdAt.millisecondsSinceEpoch);
      if (result >= 0 && result <= 1) {
        expiryPercentage = result;
      }
    }
    _start = ts['start'];
  }

  DateTime? get expiry => _expiry == null ? null : DateTime.parse(_expiry!);
  DateTime? get start => _start == null ? null : DateTime.parse(_start!);

  //get createdAt => TimeAgo.timeAgoSinceDate(Jiffy(_createdAt).fromNow());

  dynamic get time => createdAt;

  String get createdAt {
    if (_createdAt == null) {
      return '';
    }
    return timeago.format(DateTime.parse(_createdAt!), locale: 'en_short');
  }

  String get updatedAtRaw => _updatedAt ?? '';

  String get updatedAt {
    if (_updatedAt == null) {
      return createdAt;
    }
    return timeago.format(DateTime.parse(_updatedAt!), locale: 'en_short');
  }

  set updatedAtRaw(String value) {
    _updatedAt = value;
  }
}
