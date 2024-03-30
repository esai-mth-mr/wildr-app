// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_visible_for_testing_member, invalid_use_of_protected_member

import 'package:flutter/cupertino.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/onboarding_ext/onboarding_gql_queries.dart';

void print(dynamic message) {
  debugPrint('[UserInterestsGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [UserInterestsGqlIsolateBlocExt]: $message');
}

extension OnboardingGraphqlIsolateBloc on GraphqlIsolateBloc {
  Future<void> finishOnboarding(
    FinishOnboardingEvent event,
  ) async {
    final result = await gService.performMutation(
      OnboardingGQLQueries().finish,
      operationName: 'finishOnboarding',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      debugPrint('finishOnboarding for ${event.type.name} successful');
      emit(FinishOnboardingState(event.type));
    } else {
      debugPrint(result.toString());
    }
  }

  Future<void> skipOnboarding(SkipOnboardingEvent event) async {
    debugPrint('skipOnboarding');
    final result = await gService.performMutation(
      OnboardingGQLQueries().skip,
      operationName: 'skipOnboarding',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      debugPrint('skipOnboarding for ${event.type.name} successful');
      emit(FinishOnboardingState(event.type));
    } else {
      debugPrint(result.toString());
    }
  }
}
