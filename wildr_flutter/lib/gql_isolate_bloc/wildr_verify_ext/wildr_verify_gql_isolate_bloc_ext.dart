// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_mutation.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_state.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

void print(dynamic message) {
  debugPrint('[UpdateUserDetailsGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [UpdateUserDetailsGqlIsolateBlocExt]: $message');
}

extension WildrVerifyGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> wildrVerifiedManualReview(WildrVerifyEvent event) async {
    final QueryResult result = await gService.performMutation(
      WildrVerifyMutation.wildrVerifiedManualReview,
      operationName: MutationOperations.wildrVerifiedManualReview,
      variables: await event.getInput(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    print('Error Message $errorMessage');
    if (errorMessage != null) {
      emit(WildrVerifyState(errorMessage: errorMessage));
      return;
    }
    final String? successMessage =
        result.data?['wildrVerifiedManualReview']?['message'];
    if (successMessage != null && successMessage.isNotEmpty) {
      emit(WildrVerifyState(successMessage: successMessage));
    } else {
      emit(WildrVerifyState(errorMessage: kSomethingWentWrong));
      return;
    }
  }
}
