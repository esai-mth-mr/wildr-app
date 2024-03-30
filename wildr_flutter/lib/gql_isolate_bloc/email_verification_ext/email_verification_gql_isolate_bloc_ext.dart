// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';

void print(dynamic message) {
  debugPrint('[EmailVerificationGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [EmailVerificationGqlIsolateBlocExt]: $message');
}

extension EmailVerificationGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> requestVerificationEmail(
    RequestVerificationEmailEvent event,
  ) async {
    final result = await gService.performQuery(
      GQueries.kSendEmailVerificationLink,
      variables: {'input': ''},
      operationName: 'sendEmailVerificationLink',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      emit(RequestVerificationEmailState());
    } else {
      emit(RequestVerificationEmailState(errorMessage));
    }
  }
}
