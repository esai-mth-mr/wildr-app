// ignore_for_file: invalid_use_of_protected_member

part of '../gql_isolate_bloc.dart';

extension GqlIsolateBlocHelpersExtension on GraphqlIsolateBloc {
  String? checkResultRefreshCurrentUserReturnErrorMessage(
    MainBlocEvent event,
    QueryResult result,
  ) {
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      if (currentUser?.id != null) {
        refreshCurrentUserDetails(
          RefreshCurrentUserDetailsEvent(currentUser!.id),
        );
      }
    }
    return errorMessage;
  }

  String? getErrorMessageFromResultAndLogEvent(
    MainBlocEvent event,
    QueryResult result,
  ) {
    String? errorMessage;
    if (result.hasException) {
      errorMessage = kSomethingWentWrong;
      printE(
        'has exception  event: ${event.runtimeType.toString()}'
        ', \n ${result.exception}',
      );
      if (kDebugMode) {
        log(result.toString());
      }
    } else if (result.data != null) {
      errorMessage = result.smartErrorMessage();
    } else {
      errorMessage = kSomethingWentWrong;
    }
    if (event.shouldLogEvent()) {
      if (errorMessage == null) {
        logMainBlocEvent(
          event,
          isSuccessful: true,
          fromResponse: true,
        );
      } else {
        logMainBlocEvent(
          event,
          isSuccessful: false,
          fromResponse: true,
          parameters: {
            AnalyticsParameters.kDebugStackTrace:
                trimStackTrace(result.exception.toString()),
          },
        );
      }
    }
    return errorMessage;
  }

  void clearProfilePageSubscriptions() {
    print('clearProfilePageSubscriptions');
    profilePagePostsStreamSubscriptions
      ..forEach((key, subscription) => subscription.cancel())
      ..clear();
    profilePageFetchMoreFunctions.clear();
    profilePageRefetchFunctions.clear();
  }

  void clearSinglePostPageSubscriptions() {
    print('clearSinglePostPageSubscriptions');
    singlePostPageStreamSubscriptions
      ..forEach((key, subscription) => subscription.cancel())
      ..clear();
  }

  void clearMainBlocFeed() {
    print('clearHomeFeed');
    homeFeedExpectedEdgeSize = null;
    homeFeedFetchMore = null;
    homeFeedRefetch = null;
    homeFeedFetchMoreVariables = null;
    homeFeedObservableQuery = null;
    homeFeedStreamSubscription?.cancel();
    homeFeedStreamSubscription = null;
  }

  void clearCurrentUserFeed() {
    print('clearCurrentUserFeed');
    currentUserObservableQuery = null;
    currentUserFeedStreamSubscription?.cancel();
    currentUserFeedStreamSubscription = null;
    currentLoggedInUserStreamSubscription?.cancel();
    currentLoggedInUserStreamSubscription = null;
    currentUserRefetch = null;
    currentUserPostsRefetch = null;
    currentUserPostsFetchMore = null;
    currentUserPreviousListCount = 0;
    currentUser = null;
  }

  void clearAllFeedSubscriptions() {
    print('clearAllFeedSubscriptions...');
    clearCurrentUserFeed();
    clearMainBlocFeed();
  }

  void cancelSinglePostPageSubscription(String id) {
    print('cancelSinglePostPageSubscription()');
    if (singlePostPageStreamSubscriptions[id] != null) {
      singlePostPageStreamSubscriptions[id]!.cancel();
    }
  }

  void cancelProfilePagePostsSubscription(String id) {
    print('cancelProfilePagePostsSubscription $id');
    if (profilePagePostsStreamSubscriptions[id] != null) {
      profilePagePostsStreamSubscriptions[id]!.cancel();
      profilePageRefetchFunctions.remove(id);
      profilePageFetchMoreFunctions.remove(id);
    }
  }

  void cancelChallengeConnectionsSubscription(
    String challengeId,
    ChallengeConnectionType type, {
    String? userToSearchForId,
  }) {
    final id = prepareChallengeStreamSubscriptionId(
      challengeId,
      type,
      userToSearchForId: userToSearchForId,
    );
    print('cancelChallengeConnectionsSubscription $id');
    if (challengeEntriesStreamSubscriptions[id] != null) {
      challengeEntriesStreamSubscriptions[id]!.cancel();
    }
    challengeRefetchFunctions.remove(id);
    challengeFetchMoreFunctions.remove(id);
    connectionsUpcomingCount.remove(id);
  }

  void cancelChallengeAllConnectionsSubscription(String challengeId) {
    print('cancelChallengeAllConnectionsSubscription $challengeId');
    for (final type in ChallengeConnectionType.values) {
      cancelChallengeConnectionsSubscription(challengeId, type);
    }
  }

  Map<String, dynamic> getPostConnections(Map<String, dynamic> data) =>
      data['getFeed']?['feed']?['postsConnection'] ?? {};

  String? getFeedEndCursor(Map<String, dynamic> data) =>
      getPostConnections(data)['pageInfo']['endCursor'];

  List getFeedEdges(Map<String, dynamic> data) =>
      getPostConnections(data)['edges'] as List;

  List<Post> getListOfPosts(Map<String, dynamic> data) {
    final edges = getFeedEdges(data);
    return edges.map((e) => Post.fromEdge(e)).toList();
  }

  Post parsePostFromNode(QueryResult result) =>
      Post.fromNode(result.data!['getPost']['post']);

  void logMainBlocEvent(
    MainBlocEvent event, {
    bool? isSuccessful,
    Map<String, Object?>? parameters,
    bool fromResponse = false,
  }) {
    if (!event.shouldLogEvent()) return;
    String eventName = event.runtimeType.toString();
    if (fromResponse) {
      eventName += '_R';
    }
    // ignore: invalid_use_of_visible_for_testing_member
    emit(
      LogFirebaseState(
        eventName,
        isSuccessful: isSuccessful,
        parameters = event.getAnalyticParameters(),
      ),
    );
  }

  int? feedFetchMoreUpdateQuery(
    Map<String, dynamic>? previousResultData,
    Map<String, dynamic>? fetchMoreResultData,
  ) {
    fetchMoreResultData?['getFeed']?['feed']?['postsConnection']?['pageInfo']
            ?['startCursor'] =
        previousResultData?['getFeed']?['feed']?['postsConnection']?['pageInfo']
            ?['startCursor'];
    if (fetchMoreResultData == null) {
      print('FetchMoreResultData  = nul');
      return null;
    }
    final prevResultEdges = previousResultData?['getFeed']?['feed']
        ?['postsConnection']?['edges'] as List<dynamic>;
    final moreResultEdges = fetchMoreResultData['getFeed']?['feed']
        ?['postsConnection']?['edges'] as List<dynamic>;
    final List<dynamic> edges = [...prevResultEdges, ...moreResultEdges];
    fetchMoreResultData['getFeed']?['feed']?['postsConnection']?['edges'] =
        edges;
    return edges.length;
  }

  bool isCurrentUserEmpty() {
    if (currentUser == null) {
      print('currentUser = null');
      return true;
    }
    if (currentUser!.id.isEmpty) {
      print('currentUser id empty');
      return true;
    }
    return false;
  }

  String prepareChallengeStreamSubscriptionId(
    String challengeId,
    ChallengeConnectionType type, {
    String? userToSearchForId,
  }) {
    final String id = '$challengeId#${type.name}';
    if (userToSearchForId == null) return id;
    return '$id#$userToSearchForId';
  }
}
