import 'dart:convert';

import 'package:wildr_flutter/common/troll_detected_data.dart';

class TrollDetectionModel {
  bool isTroll;
  TrollData? trollDetectionData;

  TrollDetectionModel({
    required this.isTroll,
    required this.trollDetectionData,
  });

  factory TrollDetectionModel.fromJson(Map<String, dynamic>? json) {
    final trollResult = json?['detectTrolling'];
    return TrollDetectionModel(
      isTroll: trollResult?['isTroll'] ?? false,
      trollDetectionData: trollResult?['trollDetectionData']?['result'] != null
          ? TrollData.fromMap(
              jsonDecode(
                trollResult?['trollDetectionData']?['result'] as String,
              ),
            )
          : null,
    );
  }
}
