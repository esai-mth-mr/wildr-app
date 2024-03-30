// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:version/version.dart';
import 'package:wildr_flutter/gql_isolate_bloc/config_ext/config_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/config_ext/config_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';

void print(dynamic message) {
  debugPrint('[AppConfig]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [AppConfig]: $message');
}

extension AppConfig on GraphqlIsolateBloc {
  Future<void> checkForceUpdate(CheckForceUpdateEvent event) async {
    final result = await gService.performQuery(
      event.getQuery(),
      operationName: 'getAppConfig',
      variables: event.getVariables(),
    );
    final String? errorMessage = getErrorMessageFromResultAndLogEvent(
      event,
      result,
    );
    if (errorMessage == null && result.data != null) {
      final Map<String, dynamic>? appVersion =
          result.data!['getWildrAppConfig']?['appVersion'];
      final String? mandatoryVersionStr = appVersion?['mandatory'];
      if (mandatoryVersionStr != null && mandatoryVersionStr.isNotEmpty) {
        final Version currentVersion = Version.parse(packageInfo.version);
        final Version mandatoryVersion = Version.parse(mandatoryVersionStr);
        print('CurrentVersion $currentVersion');
        print('MandatoryVersion $mandatoryVersion');
        if (currentVersion < mandatoryVersion) {
          print('Version is less than mandatory version');
          emit(CheckForceUpdateState(true));
          return;
        }
      } else {
        print('MandatoryVersion is null');
      }
    }
    emit(CheckForceUpdateState(false));
  }
}
