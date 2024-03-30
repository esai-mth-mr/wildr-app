// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_states.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

void print(dynamic message) {
  debugPrint('🟢 ReactionsGqlIsolateBlocExt: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ ReactionsGqlIsolateBlocExt: $message');
}

extension ReactionGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> reactOnPost(ReactOnPostEvent event) async {
    final variables = {
      'reactOnPostInput': {
        'postId': event.postId,
        'reaction': event.reaction.toString().split('.').last,
      },
    };
    final result = await gService.performMutation(
      GQMutations.kReactOnPost,
      variables: variables,
      operationName: MutationOperations.kReactOnPost,
    );
    debugPrint(result.data.toString());
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      ReactedOnPostState(
        event.postIndex,
        errorMessage,
        event.reaction,
      ),
    );
  }
}
