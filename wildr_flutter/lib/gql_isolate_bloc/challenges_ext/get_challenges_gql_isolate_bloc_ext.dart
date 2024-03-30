// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenge_home_state.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_mutations.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/get_all_challenges_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';

void print(dynamic message) {
  debugPrint('[ChallengesGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengesGqlIsolateBlocExt]: $message');
}

class ParseGetChallengesResponse {
  final String? errorMessage;
  final List<Challenge>? challenges;
  final PageInfo? pageInfo;
  final PaginationState state;
  final ChallengesListType type;

  ParseGetChallengesResponse({
    required this.type,
    this.errorMessage,
    this.challenges,
    this.pageInfo,
    required this.state,
  });

  ParseGetChallengesResponse.fromError(this.type, this.errorMessage)
      : state = PaginationState.ERROR,
        challenges = null,
        pageInfo = null;
}

extension ChallengesGqlIsolateBlocExt on GraphqlIsolateBloc {
  ParseGetChallengesResponse _parseGetChallenges({
    required GetChallengesEvent event,
    required QueryResult result,
  }) {
    final String operationName = GetChallengesQueries().operationName;
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    final data = result.data;
    if (errorMessage != null) {
      print(
        '_parseGetChallenges [${event.type}]'
        ' error message: "$errorMessage"',
      );
      return ParseGetChallengesResponse.fromError(event.type, errorMessage);
    } else if (data == null || data[operationName]?['edges'] == null) {
      print('data is null or edges are null');
      return ParseGetChallengesResponse.fromError(
        event.type,
        kSomethingWentWrong,
      );
    }
    final dynamic edgesMap = data[operationName]['edges'];
    final Map<String, dynamic>? pageInfoMap = data[operationName]['pageInfo'];
    PageInfo? pageInfo;
    if (pageInfoMap != null) {
      pageInfo = PageInfo.fromJson(pageInfoMap);
    }
    final List edges = edgesMap as List;
    final List<Challenge> challenges =
        edges.map((json) => Challenge.fromJson(json['node'])).toList();
    return ParseGetChallengesResponse(
      type: event.type,
      challenges: challenges,
      pageInfo: pageInfo,
      state: event.after == null
          ? PaginationState.DONE_REFRESHING
          : PaginationState.DONE_PAGINATING,
    );
  }

  Future<void> getChallenges(GetChallengesEvent event) async {
    final QueryResult result = await gService.performQuery(
      event.query,
      variables: event.input,
      operationName: GetChallengesQueries().operationName,
    );
    final ParseGetChallengesResponse response = _parseGetChallenges(
      event: event,
      result: result,
    );
    emit(PaginateChallengesState.fromParseGetChallengesResponse(response));
  }

  Future<void> joinChallenge(JoinChallengeEvent event) async {
    final QueryResult result = await gService.performMutation(
      ChallengeMutations.joinChallenge,
      variables: event.getInput(),
      operationName: 'joinChallenge',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null) {
      emit(
        JoinChallengeState(
          challengeId: event.challengeId,
          errorMessage: errorMessage,
        ),
      );
      return;
    }
    final Challenge challenge =
        Challenge.fromJson(result.data!['joinChallenge']?['challenge']);
    emit(
      JoinChallengeState(
        challengeId: event.challengeId,
        challenge: challenge,
      ),
    );
  }

  Future<void> leaveChallenge(LeaveChallengeEvent event) async {
    final QueryResult result = await gService.performMutation(
      ChallengeMutations.leaveChallenge,
      variables: event.getInput(),
      operationName: 'leaveChallenge',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null) {
      emit(
        LeaveChallengeState(
          challengeId: event.challengeId,
          errorMessage: errorMessage,
        ),
      );
      return;
    }
    final Challenge challenge =
        Challenge.fromJson(result.data!['leaveChallenge']?['challenge']);
    emit(
      LeaveChallengeState(
        challengeId: event.challengeId,
        challenge: challenge,
      ),
    );
  }

  Future<void> reportChallenge(ReportChallengeEvent event) async {
    final QueryResult result = await gService.performMutation(
      ChallengeMutations.reportChallenge,
      variables: event.getInput(),
      operationName: 'reportChallenge',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null) {
      emit(
        ReportChallengeState(
          challengeId: event.challengeId,
          errorMessage: errorMessage,
        ),
      );
      return;
    }
    final Challenge challenge =
        Challenge.fromJson(result.data!['reportChallenge']?['challenge']);
    emit(
      ReportChallengeState(
        challengeId: event.challengeId,
        challenge: challenge,
      ),
    );
  }

  Future<void> getChallengePinnedComment(
    GetChallengePinnedCommentEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      ChallengeQueries().getChallengePinnedCommentQuery,
      variables: event.getInput(),
      operationName: ChallengeQueries().getChallengePinnedCommentOperationName,
    );
    String? errorMessage = getErrorMessageFromResultAndLogEvent(event, result);
    Challenge? challenge;
    if (errorMessage == null) {
      final Map<String, dynamic>? challengeJson =
          result.data?['getChallenge']?['challenge'];
      if (challengeJson == null) {
        errorMessage = kSomethingWentWrong;
      } else {
        challenge = Challenge.fromJson(challengeJson);
      }
    }
    emit(
      GetChallengePinnedCommentState(
        challengeId: event.challengeId,
        errorMessage: errorMessage,
        challenge: challenge,
      ),
    );
  }
}
