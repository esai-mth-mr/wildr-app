// ignore_for_file: invalid_use_of_visible_for_testing_member
part of 'package:wildr_flutter/bloc/main/main_bloc.dart';

extension MainBlocExtFirebaseAnalytics on MainBloc {
  void logCustomEvent(String eventName, [Map<String, String?>? parameters]) {
    parameters ??= {};
    parameters.addAll(_getMandatoryParams());
    analytics.logEvent(name: eventName, parameters: parameters);
  }

  void logFirebaseEvent(LogFirebaseState state) {
    final Map<String, dynamic> parameters = state.parameters ?? {};
    // ignore: cascade_invocations
    parameters.addAll(_getMandatoryParams());
    if (state.isSuccessful != null) {
      parameters[AnalyticsParameters.kIsSuccessful] =
          state.isSuccessful.toString();
    }
    String eventName = state.eventName;
    eventName = eventName.replaceAll('Event', '').trim();
    eventName = eventName.replaceAll('event', '').trim();
    analytics.logEvent(name: eventName, parameters: parameters);
  }

  Map<String, String> _getMandatoryParams() => {
        'timeStamp': DateTime.now().microsecondsSinceEpoch.toString(),
        'deviceId': deviceId ?? kNA,
        'deviceModel': deviceModel ?? kNA,
        'deviceVersion': deviceVersion ?? kNA,
        'version': _packageInfo.version,
        'userId': currentUserId,
      };

  void logMainBlocEvent(
    String eventName, {
    bool hasFailed = false,
    bool isSuccessful = false,
    Map<String, Object?>? parameters,
  }) {
    parameters ??= {};
    parameters.addAll(_getMandatoryParams());
    //if (kDebugMode) return;
    eventName.replaceAll('Event', '');
    final String name = hasFailed
        ? '${eventName}_failed'
        : isSuccessful
            ? '${eventName}_ok'
            : eventName;
    analytics.logEvent(
      name: name,
      parameters: hasFailed ? parameters : null,
    );
  }

  Future<void> _initDeviceMetaForAnalytics() async {
    final DeviceInfoPlugin deviceInfoPlugin = DeviceInfoPlugin();
    //const androidIdPlugin = AndroidId();
    try {
      if (Platform.isAndroid) {
        final build = await deviceInfoPlugin.androidInfo;
        deviceModel = build.model;
        deviceVersion = build.version.release;
        //deviceId =  await androidIdPlugin.getId() ?? ""; //UUID for Android
      } else if (Platform.isIOS) {
        final data = await deviceInfoPlugin.iosInfo;
        deviceModel = data.name;
        deviceVersion = data.systemVersion;
        deviceId = data.identifierForVendor ?? kNA; //UUID for iOS
      }
    } on PlatformException {
      debugPrint('Failed to get platform version');
    }
  }
}
