// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_config.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_state_and_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';

void print(dynamic message) {
  debugPrint('[FeatureFlagGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [FeatureFlagGqlIsolateBlocExt]: $message');
}

extension FeatureFlagGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> getFlags(GetFeatureFlagsEvent event) async {
    final result = await gService.performQuery(
      GQueries.kGetFeatureFlags,
      operationName: QueryOperations.kGetFeatureFlags,
    );
    final errorMessage = getErrorMessageFromResultAndLogEvent(event, result);
    FeatureFlagsConfig? config;
    if (errorMessage == null && result.data != null) {
      final jsonMap = result.data![QueryOperations.kGetFeatureFlags];
      if (jsonMap != null) {
        config = FeatureFlagsConfig.fromJson(jsonMap);
      }
    }
    emit(GetFeatureFlagsState(config));
  }
}
