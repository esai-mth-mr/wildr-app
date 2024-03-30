// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_visible_for_testing_member, invalid_use_of_protected_member

import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_event.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_state.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/models/pin_challenge_entry_result_model.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_mutations.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';

extension ChallengePostGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> pinChallengeEntry(PinChallengeEntryEvent event) async {
    final QueryResult result = await gService.performMutation(
      ChallengeMutations.kPinChallengeEntry,
      variables: event.getInput(),
      operationName: 'PinChallengeEntry',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    if (errorMessage != null) {
      emit(PinChallengeEntryState(errorMessage: errorMessage));
      return;
    }
    emit(
      PinChallengeEntryState(
        pinChallengeEntryResult:
            PinChallengeEntryResult.fromJson(result.data!['pinChallengeEntry']),
      ),
    );
  }

  Future<void> getJoinedChallenges(GetJoinedChallengesEvent event) async {
    emit(GetJoinedChallengesState.loading());
    final QueryResult result = await gService.performQuery(
      ChallengeQueries().getJoinedChallengesQuery,
      variables: event.getInput(),
      operationName: 'getJoinedChallenges',
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    if (errorMessage != null) {
      emit(GetJoinedChallengesState.fromError(errorMessage));
      return;
    }
    if (result.data != null) {
      final data = result.data!;
      final dynamic edgesMap = data['getJoinedChallenges']?['challenges'];
      if (edgesMap == null) {
        print('Edges map is null');
        return;
      }
      final List edges = edgesMap as List;
      final List<Challenge> challenges =
          edges.map((json) => Challenge.fromJson(json)).toList();
      emit(GetJoinedChallengesState.fromList(challenges));
    }
  }
}
