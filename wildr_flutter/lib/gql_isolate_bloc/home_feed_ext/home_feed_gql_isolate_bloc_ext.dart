// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';

void print(dynamic message) {
  debugPrint('[HomeFeedGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [HomeFeedGqlIsolateBlocExt]: $message');
}

extension HomeFeedGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> getHomeFeed(GetFeedEvent event) async {
    print('GetHomeFeed');
    if (homeFeedStreamSubscription != null) {
      await homeFeedStreamSubscription!.cancel();
    }
    final variables = {
      'getFeedInput': {
        'feedType': 'ALL',
        'scopeType': selectedFeedScopeTypeStr,
      },
      'first': 8,
      'after': '',
    };

    final ObservableQuery? observableQuery = gService.performWatchQuery(
      HomeFeedQueries.initialFeedQuery(),
      variables: variables,
      operationName: QueryOperations.kPaginatedFeed,
    );
    if (observableQuery == null) {
      emit(
        HomeFeedUpdateState(
          errorMessage: kSomethingWentWrong,
          isSuccessful: false,
        ),
      );
      return;
    }
    homeFeedObservableQuery = observableQuery;
    homeFeedFetchMore = observableQuery.fetchMore;
    homeFeedRefetch = observableQuery.refetch;
    homeFeedStreamSubscription = observableQuery.stream.listen((result) {
      print('RESULT src ${result.source}');
      // if (result.source == QueryResultSource.network) {
      //   getErrorMessageFromResultAndLogEvent(event, result);
      // }
      if (result.isLoading) {
        debugPrint('IsLoading');
      } else if (result.hasException) {
        if (isDisconnected) {
          emit(
            HomeFeedUpdateState(
              errorMessage: kNoInternetError,
              isSuccessful: false,
            ),
          );
        } else {
          emit(
            HomeFeedUpdateState(
              errorMessage: kSomethingWentWrong,
              isSuccessful: false,
            ),
          );
        }
        printE('[RefreshFeed Event] ${result.exception} ---- \n $result');
        emit(CanPaginateHomeFeedState(true));
      } else if (result.data != null) {
        final Map<String, dynamic> data = result.data!;
        final String endCursor = getFeedEndCursor(data) ?? '';
        final List<Post> listOfPosts = getListOfPosts(data);
        debugPrint('Length of listOfPosts ${listOfPosts.length}');
        if (homeFeedExpectedEdgeSize != null) {
          debugPrint('homeFeedExpectedEdgeSize != null');
          if (homeFeedExpectedEdgeSize != listOfPosts.length) {
            debugPrint(
              "Expected size didn't match, thus re-paginating  "
              'expected = $homeFeedExpectedEdgeSize '
              '&& ${listOfPosts.length} ',
            );
            homeFeedExpectedEdgeSize = null;
          }
        }
        emit(HomeFeedUpdateState(posts: listOfPosts, endCursor: endCursor));
        emit(CanPaginateHomeFeedState(listOfPosts.isNotEmpty));
      } else {
        emit(
          HomeFeedUpdateState(
            errorMessage: kSomethingWentWrong,
            isSuccessful: false,
          ),
        );
      }
    });
    return;
  }

  void updateHomeFeedVariablesAndRefetch(UpdateHomeFeedVariablesEvent event) {
    debugPrint('updateHomeFeedVariablesAndRefetch');
    if (homeFeedObservableQuery == null) {
      print('_homeFeedObservableQuery = null');
      homeFeedRefetch = null;
      homeFeedStreamSubscription?.cancel();
      add(
        GetFeedEvent(
          feedPostType: event.feedPostType,
          scopeType: event.feedScopeType,
        ),
      );
      return;
    }
    selectedFeedScopeTypeStr = event.feedScopeType.name;
    final variables = {
      'getFeedInput': {
        'feedType': event.feedPostType.name,
        'scopeType': event.feedScopeType.name,
      },
      'first': event.first,
    };
    homeFeedObservableQuery!.variables = variables;
    emit(HomeFeedVariablesUpdatedState());
    // refetchHomeFeed();
  }

  Future<void> refetchHomeFeed({required FeedScopeType feedScopeType}) async {
    if (homeFeedRefetch != null) {
      try {
        if (homeFeedObservableQuery?.isRefetchSafe ?? false) {
          await homeFeedRefetch!();
          return;
        }
      } catch (err) {
        printE(err);
      }
    }
    await homeFeedStreamSubscription?.cancel(); //just to be safe
    homeFeedStreamSubscription = null; //just to be safe
    add(GetFeedEvent(scopeType: feedScopeType));
  }

  Future<void> fetchMoreHomeFeed(PaginateHomeFeedEvent? event) async {
    debugPrint('fetchMoreHomeFeed');
    if (homeFeedFetchMore == null) {
      printE('homeFeedFetchMore() = NULL');
      return;
    }
    Map<String, dynamic> variablesFetchMore;
    if (event == null) {
      debugPrint('event = null');
      if (homeFeedFetchMoreVariables == null) {
        printE('_fetchMoreVariables = NULL');
        return;
      }
      variablesFetchMore = homeFeedFetchMoreVariables!;
      homeFeedExpectedEdgeSize = null;
      homeFeedFetchMoreVariables = null;
    } else {
      variablesFetchMore = {
        'getFeedInput': {
          'feedType': event.filter,
          'scopeType': event.scopeFilter,
        },
        'first': 12,
        'after': event.endCursor,
      };
      homeFeedFetchMoreVariables = variablesFetchMore;
    }
    debugPrint(variablesFetchMore.toString());
    final FetchMoreOptions fetchMoreOptions = FetchMoreOptions(
      variables: variablesFetchMore,
      updateQuery: (
        previousResultData,
        fetchMoreResultData,
      ) {
        final edgesLength = feedFetchMoreUpdateQuery(
          previousResultData,
          fetchMoreResultData,
        );
        if (edgesLength == null) return previousResultData;
        homeFeedExpectedEdgeSize = edgesLength;
        debugPrint(
          'Set the value of homeFeedExpectedEdgeSize $homeFeedExpectedEdgeSize',
        );
        return fetchMoreResultData;
      },
    );
    await homeFeedFetchMore!(fetchMoreOptions);
    // the homeFeedFetchMore call is not triggering any cache update,
    // therefore manually rebroadcasting queries
  }

  Future<void> updateLastSeenCursor(UpdateHomeFeedLastSeenCursor event) async {
    if (isCurrentUserEmpty()) return;
    await gService.performMutation(
      GQMutations.kUpdateLastSeenCursor,
      operationName: 'updateLastSeenCursor',
      variables: event.getVariables(),
      cacheRereadPolicy: CacheRereadPolicy.ignoreAll,
      fetchPolicy: FetchPolicy.noCache,
    );
  }
}
