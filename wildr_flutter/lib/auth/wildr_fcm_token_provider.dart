import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/analytics/analytics_common.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';

class WildrFcmTokenProvider {
  static final WildrFcmTokenProvider _instance =
      WildrFcmTokenProvider._internal();

  factory WildrFcmTokenProvider() => _instance;

  WildrFcmTokenProvider._internal();

  Future<String?> getFcmToken() async {
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (e, stacktrace) {
      print(e.toString());
      await FirebaseCrashlytics.instance.recordError(
        e,
        stacktrace,
        reason: 'WildrFcmTokenProvider _getTokenException',
      );
      await FirebaseAnalytics.instance.logEvent(
        name: DebugEvents.kDebugGetFCMTokenUnhandledException,
        parameters: {
          AnalyticsParameters.kExceptionName: e.runtimeType.toString(),
          AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
        },
      );
      return null;
    }
  }
}

void print(dynamic message) {
  debugPrint('[WildrFcmTokenProvider]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ WildrFcmTokenProvider: $message');
}
