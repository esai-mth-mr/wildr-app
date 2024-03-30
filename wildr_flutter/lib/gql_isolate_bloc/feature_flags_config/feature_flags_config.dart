import 'dart:convert';

import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class FeatureFlagsConfig {
  late final bool createPostV2;
  late final bool bannersEnabled;
  late final bool coinDashboardPart1;
  late final bool coinDashboardPart2;
  late final bool videoCompressionRes960x540Quality;

  FeatureFlagsConfig.fromJson(Map<String, dynamic> json) {
    createPostV2 = json['createPostV2'] ?? DEFAULT_CREATE_POST_V2_FLAG;
    bannersEnabled = json['bannersEnabled'] ?? DEFAULT_BANNERS_FLAG;
    coinDashboardPart1 =
        json['coinDashboardPart1'] ?? COIN_DASHBOARD_PART_1_FLAG;
    coinDashboardPart2 =
        json['coinDashboardPart2'] ?? COIN_DASHBOARD_PART_2_FLAG;
    videoCompressionRes960x540Quality =
        json['videoCompressionRes960x540Quality'] ?? DEFAULT_VIDEO_UPLOAD_FLAG;
  }

  FeatureFlagsConfig.defaultConfig() {
    createPostV2 = DEFAULT_CREATE_POST_V2_FLAG;
    bannersEnabled = DEFAULT_BANNERS_FLAG;
    coinDashboardPart1 = COIN_DASHBOARD_PART_1_FLAG;
    coinDashboardPart2 = DEFAULT_CREATE_POST_V2_FLAG;
    videoCompressionRes960x540Quality = DEFAULT_VIDEO_UPLOAD_FLAG;
  }

  factory FeatureFlagsConfig.fromPrefsOrDefault() {
    final configStr = Prefs.getString(PrefKeys.kFeatureFlagsConfig);
    if (configStr == null) {
      debugPrint('configStr not found for: ${PrefKeys.kFeatureFlagsConfig}');
      return FeatureFlagsConfig.defaultConfig();
    }
    try {
      return FeatureFlagsConfig.fromJson(jsonDecode(configStr));
    } catch (e, stack) {
      FirebaseCrashlytics.instance.recordError(e, stack);
      debugPrint(e.toString());
    }
    return FeatureFlagsConfig.defaultConfig();
  }

  Map<String, dynamic> toJson() => {
        'createPostV2': createPostV2,
        'bannersEnabled': bannersEnabled,
        'coinDashboardPart1': coinDashboardPart1,
        'coinDashboardPart2': coinDashboardPart2,
        'videoUploadTest': videoCompressionRes960x540Quality,
      };

  void saveToPrefs() {
    final configStr = jsonEncode(this);
    Prefs.setString(PrefKeys.kFeatureFlagsConfig, configStr);
  }
}

const DEFAULT_CREATE_POST_V2_FLAG = false;
const DEFAULT_BANNERS_FLAG = false;
const COIN_DASHBOARD_PART_1_FLAG = false;
const COIN_DASHBOARD_PART_2_FLAG = false;
const DEFAULT_VIDEO_UPLOAD_FLAG = false;
