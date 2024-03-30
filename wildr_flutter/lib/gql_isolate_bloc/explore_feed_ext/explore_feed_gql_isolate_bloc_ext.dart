// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_visible_for_testing_member, invalid_use_of_protected_member

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_gql_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';

void print(dynamic message) {
  debugPrint('[ExploreFeedGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ExploreFeedGqlIsolateBlocExt]: $message');
}

extension ExploreFeedGqlIsolateBlocExt on GraphqlIsolateBloc {
  void getExploreFeed() {
    print('getExploreFeed');
    if (exploreFeedStreamSubscription != null) {
      exploreFeedStreamSubscription!.cancel();
    }
    final variables = {
      'getFeedInput': {
        'feedType': 'ALL',
        'scopeType': FeedScopeType.PERSONALIZED.name,
      },
      'first': 8,
      'after': '',
    };
    final ObservableQuery? observableQuery = gService.performWatchQuery(
      ExploreFeedGqlQueries().exploreFeed(),
      variables: variables,
      operationName: QueryOperations.kExploreFeed,
    );
    if (observableQuery == null) {
      emit(
        ExploreFeedUpdateState(
          errorMessage: kSomethingWentWrong,
        ),
      );
      return;
    }

    exploreFeedObservableQuery = observableQuery;
    exploreFeedFetchMore = observableQuery.fetchMore;
    exploreFeedRefetch = observableQuery.refetch;
    exploreFeedStreamSubscription =
        exploreFeedObservableQuery!.stream.listen((result) {
      if (result.isLoading) {
        // print("IsLoading");
      } else if (result.hasException) {
        emit(
          ExploreFeedUpdateState(
            errorMessage:
                isDisconnected ? kNoInternetError : kSomethingWentWrong,
          ),
        );
        printE('[RefreshFeed Event] ${result.exception} ---- \n $result');
        emit(CanPaginateExploreFeedState(true));
      } else if (result.data != null) {
        final Map<String, dynamic> data = result.data!;
        final String endCursor = getFeedEndCursor(data) ?? '';
        final List<Post> listOfPosts = getListOfPosts(data);
        if (exploreFeedExpectedEdgeSize != null) {
          if (exploreFeedExpectedEdgeSize != listOfPosts.length) {
            print(
              "Expected size didn't match, thus re-paginating  expected ="
              ' $exploreFeedExpectedEdgeSize && ${listOfPosts.length} ',
            );
            exploreFeedExpectedEdgeSize = null;
          }
        }
        emit(ExploreFeedUpdateState(posts: listOfPosts, endCursor: endCursor));
        emit(CanPaginateExploreFeedState(listOfPosts.isNotEmpty));
      } else {
        emit(ExploreFeedUpdateState(errorMessage: kSomethingWentWrong));
      }
    });
    return;
  }

  void updateExploreFeedVariablesAndRefetch(
    UpdateExploreFeedVariablesEvent event,
  ) {
    print('updateExploreFeedVariablesAndRefetch');
    if (exploreFeedObservableQuery == null) {
      printE('_exploreFeedObservableQuery = null');
      return;
    }
    selectedFeedScopeTypeStr = event.feedScopeTypeStr;
    final variables = {
      'getFeedInput': {
        'feedType': event.feedPostTypeStr,
        'scopeType': event.feedScopeTypeStr,
      },
      'first': event.first,
    };
    exploreFeedObservableQuery!.variables = variables;
    emit(ExploreFeedVariablesUpdatedState());
  }

  Future<void> refetchExploreFeed() async {
    print('refetchExploreFeed');
    if (exploreFeedRefetch != null) {
      try {
        if (exploreFeedObservableQuery?.isRefetchSafe ?? false) {
          await exploreFeedRefetch!();
          return;
        }
        printE('Is not refetch safe');
      } catch (err) {
        printE(err);
      }
    }
    await exploreFeedStreamSubscription?.cancel(); //just to be safe
    exploreFeedStreamSubscription = null; //just to be safe
    add(GetExploreFeedEvent());
  }

  Future<void> fetchMoreExploreFeed(PaginateExploreFeedEvent? event) async {
    print('fetchMoreExploreFeed');
    if (exploreFeedFetchMore == null) {
      printE('exploreFeedFetchMore() = NULL');
      return;
    }
    Map<String, dynamic> variablesFetchMore;
    if (event == null) {
      print('event = null');
      if (exploreFeedFetchMoreVariables == null) {
        printE('_fetchMoreVariables = NULL');
        return;
      }
      variablesFetchMore = exploreFeedFetchMoreVariables!;
      exploreFeedExpectedEdgeSize = null;
      exploreFeedFetchMoreVariables = null;
    } else {
      variablesFetchMore = {
        'getFeedInput': {
          'feedType': event.postType,
          'scopeType': event.scopeType,
        },
        'first': 8,
        'after': event.endCursor,
      };
      exploreFeedFetchMoreVariables = variablesFetchMore;
    }
    print(variablesFetchMore);
    final FetchMoreOptions fetchMoreOptions = FetchMoreOptions(
      variables: variablesFetchMore,
      updateQuery: (
        previousResultData,
        fetchMoreResultData,
      ) {
        final edgesLength =
            feedFetchMoreUpdateQuery(previousResultData, fetchMoreResultData);
        if (edgesLength == null) return previousResultData;
        exploreFeedExpectedEdgeSize = edgesLength;
        return fetchMoreResultData;
      },
    );
    await exploreFeedFetchMore!(fetchMoreOptions);
  }

  Future<void> updateExploreFeedLastSeenCursor(
    UpdateExploreFeedLastSeenCursorEvent event,
  ) async {
    print('updateExploreFeedLastSeenCursor');
    if (isCurrentUserEmpty()) return;
    await gService.performMutation(
      GQMutations.kUpdateExploreFeedLastSeenCursor,
      operationName: 'updateLastSeenCursor',
      variables: event.getVariables(),
      cacheRereadPolicy: CacheRereadPolicy.ignoreAll,
      fetchPolicy: FetchPolicy.noCache,
    );
  }
}
