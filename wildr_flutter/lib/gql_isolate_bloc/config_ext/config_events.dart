import 'dart:io';

import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class CheckForceUpdateEvent extends MainBlocEvent {
  String getQuery() => r'''
    query getAppConfig($input: WildrAppConfigInput!) {
      getWildrAppConfig(input: $input) {
        ... on WildrAppConfig {
          __typename
          appVersion {
            __typename
            latest
            mandatory
          } 
        }
        ... on SmartError {
          __typename
          message
        }
      }
    }
    ''';

  Map<String, dynamic> getVariables() => {
        'input': {'osName': Platform.operatingSystem.toUpperCase()},
      };
}
