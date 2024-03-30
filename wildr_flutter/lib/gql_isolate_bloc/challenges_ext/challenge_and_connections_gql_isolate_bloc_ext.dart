// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member, cancel_subscriptions, no_default_cases

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';

void print(dynamic message) {
  debugPrint('[ChallengeAndConnectionsGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengeAndConnectionsGqlIsolateBlocExt]: $message');
}

class ParsedPaginationResult {
  String challengeId;
  String? errorMessage;
  Challenge? challenge;

  ParsedPaginationResult(this.challengeId, this.errorMessage, this.challenge);
}

extension ChallengeAndConnectionsGqlIsolateBlocExt on GraphqlIsolateBloc {
  Challenge? _parseChallengeFromResult(
    Map<String, dynamic> result, {
    PaginationState? paginationState,
  }) {
    final Map<String, dynamic>? challengeJson =
        result[ChallengeQueries().operationName]?['challenge'];
    if (challengeJson == null) return null;
    return Challenge.fromJson(challengeJson, paginationState: paginationState);
  }

  Map<String, dynamic> _paginationVariable(
    SingleChallengePaginateEntriesEvent event,
  ) {
    final Map<String, dynamic> input = {
      'challengeId': event.challengeId,
    };
    final Map<String, dynamic> paginationInput = {'take': event.take};
    if (event.after != null) {
      print('after = ${event.after}');
      paginationInput['after'] = event.after;
    }
    if (event is PaginateCurrentUserEntriesEvent) {
      paginationInput['order'] = 'OLDEST_FIRST';
    } else if (event is PaginateUserEntriesEvent) {
      input['userToSearchForId'] = event.userToSearchForId ?? '';
    }
    input['paginationInput'] = paginationInput;
    return input;
  }

  FetchMoreOptions _fetchMoreOptions(
    ChallengeConnectionType connectionType,
    Map<String, dynamic> variables,
    String entryId,
  ) =>
      FetchMoreOptions(
        variables: variables,
        updateQuery: (
          previousResultData,
          fetchMoreResultData,
        ) {
          fetchMoreResultData?[ChallengeQueries().operationName]?['challenge']
                  ?[connectionType.name]?['pageInfo']['startCursor'] =
              previousResultData?[ChallengeQueries().operationName]
                      ?['challenge']?[connectionType.name]?['pageInfo']
                  ['startCursor'];
          final previousEdges =
              previousResultData?[ChallengeQueries().operationName]
                          ?['challenge']?[connectionType.name]?['edges']
                      as List<dynamic>? ??
                  [];
          final newEdges =
              fetchMoreResultData?[ChallengeQueries().operationName]
                          ?['challenge']?[connectionType.name]?['edges']
                      as List<dynamic>? ??
                  [];
          final List<dynamic> edges = [...previousEdges, ...newEdges];
          final List<dynamic> uniqueEdges = [];
          for (final edge in edges) {
            final index = uniqueEdges
                .indexWhere((element) => element['cursor'] == edge['cursor']);
            if (index == -1) {
              uniqueEdges.add(edge);
            } else {
              print('Skipping');
            }
          }
          fetchMoreResultData?[ChallengeQueries().operationName]?['challenge']
              ?[connectionType.name]?['edges'] = uniqueEdges;
          connectionsUpcomingCount[entryId] = uniqueEdges.length;
          return fetchMoreResultData;
        },
      );

  Future<bool> _checkAndPerformFetchMore(
    SingleChallengePaginateEntriesEvent event,
  ) async {
    final entryId = prepareChallengeStreamSubscriptionId(
      event.challengeId,
      event.connectionType,
      userToSearchForId: event.userToSearchForId,
    );
    final FetchMore? fetchMore = challengeFetchMoreFunctions[entryId];
    if (fetchMore == null) {
      printE('fetchMore = null ${event.runtimeType}');
      return false;
    }
    //Log firebase event
    logMainBlocEvent(event, parameters: {'isFetchMore': true});
    final Map<String, dynamic> variablesFetchMore = _paginationVariable(event);
    await fetchMore(
      _fetchMoreOptions(event.connectionType, variablesFetchMore, entryId),
    );
    return true;
  }

  ParsedPaginationResult _parsePaginationResult(
    SingleChallengePaginateEntriesEvent event,
    QueryResult result,
  ) {
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    Challenge? challenge;
    PaginationState? paginationState;
    if (errorMessage != null) {
      paginationState = PaginationState.ERROR;
    } else if (event.after != null) {
      paginationState = PaginationState.DONE_PAGINATING;
    } else {
      paginationState = PaginationState.DONE_REFRESHING;
    }
    if (errorMessage == null && result.data != null) {
      challenge = _parseChallengeFromResult(
        result.data!,
        paginationState: paginationState,
      );
    }
    return ParsedPaginationResult(event.challengeId, errorMessage, challenge);
  }

  Future<bool> _useSubscriptions(
    SingleChallengePaginateEntriesEvent event,
    entryId,
  ) async {
    if (event.after == null) {
      //is refresh
      final refetchFunction = challengeRefetchFunctions[entryId];
      if (refetchFunction != null) {
        print('Using refetch function');
        connectionsUpcomingCount.remove(entryId);
        await refetchFunction();
        return true;
      }
    } else {
      return await _checkAndPerformFetchMore(event);
    }
    return false;
  }

  void _checkAndMutate(
    String entryId,
    ChallengeEntriesConnection? entriesConnection,
  ) {
    if (connectionsUpcomingCount[entryId] != null &&
        entriesConnection != null) {
      final entriesLength = entriesConnection.entries.length;
      if (entriesLength < connectionsUpcomingCount[entryId]!) {
        print('MUTATING resultant count $entriesLength '
            'and upcoming count ${connectionsUpcomingCount[entryId]} '
            '$entryId');
        connectionsUpcomingCount.remove(entryId);
      }
    }
  }

  Future<void> paginateChallengeConnectionWithWatchQuery(
    SingleChallengePaginateEntriesEvent event,
  ) async {
    final entryId = prepareChallengeStreamSubscriptionId(
      event.challengeId,
      event.connectionType,
      userToSearchForId: event.userToSearchForId,
    );
    final bool didUseExistingSubscription =
        await _useSubscriptions(event, entryId);
    if (didUseExistingSubscription) {
      print('Using existing subscription');
      return;
    }
    final ObservableQuery? observableQuery = gService.performWatchQuery(
      ChallengeQueries().paginateEntriesQuery(event.connectionType),
      operationName: ChallengeQueries().operationName,
      variables: _paginationVariable(event),
    );
    if (observableQuery == null) {
      final parsedResult =
          ParsedPaginationResult(event.challengeId, kSomethingWentWrong, null);
      _handleParsedResult(event, entryId, parsedResult);
      return;
    }
    challengeEntriesStreamSubscriptions[entryId] =
        observableQuery.stream.listen((result) {
      if (result.isLoading) return;
      final parsedResult = _parsePaginationResult(event, result);
      _handleParsedResult(event, entryId, parsedResult);
    });
    challengeFetchMoreFunctions[entryId] = observableQuery.fetchMore;
    challengeRefetchFunctions[entryId] = observableQuery.refetch;
  }

  void _handleParsedResult(
    SingleChallengePaginateEntriesEvent event,
    String entryId,
    ParsedPaginationResult parsedResult,
  ) {
    switch (event.connectionType) {
      case ChallengeConnectionType.allEntriesConnection:
        emit(PaginateAllEntriesState.fromParsedResult(parsedResult));
        _checkAndMutate(
          entryId,
          parsedResult.challenge?.allEntriesConnection,
        );
      case ChallengeConnectionType.todayEntriesConnection:
        emit(PaginateTodayEntriesState.fromParsedResult(parsedResult));
        _checkAndMutate(
          entryId,
          parsedResult.challenge?.todayEntriesConnection,
        );
      case ChallengeConnectionType.featuredEntriesConnection:
        emit(PaginateFeaturedEntriesState.fromParsedResult(parsedResult));
        _checkAndMutate(
          entryId,
          parsedResult.challenge?.featuredEntriesConnection,
        );
      case ChallengeConnectionType.currentUserEntriesConnection:
        emit(
          PaginateCurrentUserEntriesState.fromParsedResult(parsedResult),
        );
        _checkAndMutate(
          entryId,
          parsedResult.challenge?.currentUserEntriesConnection,
        );
      case ChallengeConnectionType.userEntriesConnection:
        emit(
          PaginateUserEntriesState.fromParsedResult(
            parsedResult,
            event.userToSearchForId!,
          ),
        );
        _checkAndMutate(
          entryId,
          parsedResult
              .challenge?.userEntriesConnectionsMap?[event.userToSearchForId!],
        );
      case ChallengeConnectionType.commentsConnection:
        // TODO: Handle this case.
        break;
      default:
        print("Shouldn't be here");
        break;
    }
  }

  ///Used by
  ///[PaginateParticipantsEvent]
  ///[PaginateLeaderboardsEvent]
  Future<void> paginateChallengeConnection(
    SingleChallengePaginateEntriesEvent event,
  ) async {
    //Perform refetch and fetchMore here
    final String query;
    if (event.connectionType == ChallengeConnectionType.leaderboardConnection) {
      query = ChallengeQueries().paginateLeaderboardsQuery;
    } else if (event.connectionType ==
        ChallengeConnectionType.participantsConnection) {
      query = ChallengeQueries().paginateParticipantsQuery;
    } else {
      printE('trying to fetch unknown connection');
      return;
    }
    final QueryResult result = await gService.performQuery(
      query,
      operationName: ChallengeQueries().operationName,
      variables: _paginationVariable(event),
      fetchPolicy: FetchPolicy.noCache,
    );
    final parsedResult = _parsePaginationResult(event, result);
    switch (event.connectionType) {
      case ChallengeConnectionType.participantsConnection:
        emit(PaginateParticipantsState.fromParsedResult(parsedResult));
      case ChallengeConnectionType.leaderboardConnection:
        emit(PaginateLeaderboardsState.fromParsedResult(parsedResult));
      case ChallengeConnectionType.commentsConnection:
        // TODO: Handle this case.
        break;
      default:
        print('reached default state');
    }
  }

  Future<void> getSingleChallenge(GetSingleChallengeDetailsEvent event) async {
    final entryId = prepareChallengeStreamSubscriptionId(
      event.challengeId,
      ChallengeConnectionType.undefined,
    );
    final refetchFunction = challengeRefetchFunctions[entryId];
    if (refetchFunction != null) {
      await refetchFunction();
      connectionsUpcomingCount.remove(entryId);
      return;
    }
    final observableQuery = gService.performWatchQuery(
      ChallengeQueries().singleChallengeDetailsQuery,
      operationName: ChallengeQueries().operationName,
      variables: {
        'input': {'id': event.challengeId},
      },
    );
    if (observableQuery == null) {
      emit(
        GetSingleChallengeDetailsState(
          challengeId: event.challengeId,
          errorMessage: kSomethingWentWrong,
        ),
      );
      return;
    }
    challengeEntriesStreamSubscriptions[entryId] =
        observableQuery.stream.listen((result) {
      if (result.isLoading) return;
      final String? errorMessage =
          getErrorMessageFromResultAndLogEvent(event, result);
      Challenge? challenge;
      if (errorMessage == null && result.data != null) {
        challenge = _parseChallengeFromResult(result.data!);
      }
      emit(
        GetSingleChallengeDetailsState(
          challengeId: event.challengeId,
          challenge: challenge,
          errorMessage: errorMessage,
        ),
      );
    });
    challengeFetchMoreFunctions[entryId] = observableQuery.fetchMore;
    challengeRefetchFunctions[entryId] = observableQuery.refetch;
  }
}
