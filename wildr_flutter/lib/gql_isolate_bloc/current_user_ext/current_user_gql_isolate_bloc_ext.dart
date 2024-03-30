// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_notifications/model/user_activity.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_gql_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[CurrentUserGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [CurrentUserGqlIsolateBlocExt]: $message');
}

extension CurrentUserGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> refreshCurrentUserDetails(
    RefreshCurrentUserDetailsEvent event,
  ) async {
    if (isDisconnected) {
      emit(
        CurrentUserProfileRefreshState(
          isSuccessful: false,
          errorMessage: kNoInternetError,
        ),
      );
      return;
    }
    // print("_refreshCurrentUserDetails");
    if (currentUserRefetch != null) {
      await currentUserRefetch!();
      debugPrint('Reusing currentLoggedInUserRefetch');
      return;
    }
    final variables = {
      'getUserInput': {'id': event.idOfUserToFetch},
      'first': 10,
    };
    final ObservableQuery? observableQuery = gService.performWatchQuery(
      GQueries.getCurrentUser(),
      variables: variables,
      operationName: QueryOperations.kGetUser,
    );
    if (observableQuery == null) {
      emit(
        CurrentUserProfileRefreshState(
          isSuccessful: false,
          errorMessage: kSomethingWentWrong,
        ),
      );
      return;
    }
    currentUserObservableQuery = observableQuery;
    currentUserRefetch = currentUserObservableQuery?.refetch;
    currentLoggedInUserStreamSubscription =
        currentUserObservableQuery?.stream.listen((result) {
      if (result.isLoading) return;
      if (result.hasException) {
        if (isDisconnected) {
          emit(
            CurrentUserProfileRefreshState(
              isSuccessful: false,
              errorMessage: kNoInternetError,
            ),
          );
          return;
        }
        printE('[RefreshCurrentUserDetailsEvent] ${result.exception}');
        emit(
          CurrentUserProfileRefreshState(
            isSuccessful: false,
            errorMessage: kSomethingWentWrong,
          ),
        );
      } else if (result.data != null) {
        final user = WildrUser.fromData(result.data!);
        emit(CurrentUserProfileRefreshState(isSuccessful: true, user: user));
      } else {
        printE('[RefreshCurrentUserDetailsEvent] $result');
        emit(
          CurrentUserProfileRefreshState(
            isSuccessful: false,
            errorMessage: kSomethingWentWrong,
          ),
        );
      }
    });
  }

  //Current User Posts
  Future<void> getCurrentUserPosts(GetCurrentUserPostsEvent event) async {
    if (event.idOfUser == null && currentUser == null) {
      debugPrint('{event.idOfUser == null} && {currentUser == null}');
      return;
    }
    final Map<String, dynamic> variables = {
      'getUserInput': {'id': event.idOfUser ?? currentUser?.id},
      'first': 9,
      'after': event.endCursor,
    };
    final ObservableQuery? observableQuery = gService.performWatchQuery(
      GQueries.kPaginatedUserPosts,
      variables: variables,
      operationName: QueryOperations.kPaginateUserPosts,
    );
    if (observableQuery == null) {
      emit(
        CurrentUserPaginatedPostsState(
          errorMessage: kSomethingWentWrong,
        ),
      );
      return;
    }
    currentUserPostsFetchMore = observableQuery.fetchMore;
    currentUserPostsRefetch = observableQuery.refetch;
    currentUserFeedStreamSubscription = observableQuery.stream.listen(
      (result) {
        if (result.isLoading) {
        } else if (result.hasException) {
          if (isDisconnected) {
            emit(
              CurrentUserPaginatedPostsState(errorMessage: kNoInternetError),
            );
          }
          printE('CURRENT USER POSTS EXCEPTION ${result.exception}');
          emit(
            CurrentUserPaginatedPostsState(
              errorMessage: kSomethingWentWrong,
            ),
          );
        } else if (result.data != null) {
          final Map<String, dynamic> data = result.data!;
          if (data['getUser'] == null) {
            emit(CurrentUserPaginatedPostsState(errorMessage: 'NO DATA FOUND'));
            return;
          } else if (data['getUser']['user'] == null) {
            emit(CurrentUserPaginatedPostsState(errorMessage: 'NO DATA FOUND'));
            return;
          }
          final Map<String, dynamic> pc =
              data['getUser']['user']['postsConnection'];
          final String endCursor = pc['pageInfo']['endCursor'];
          print('END CURSOR = $endCursor');
          final List edges = pc['edges'] as List;
          final List<Post> listOfPosts = [];
          // ignore: cascade_invocations
          listOfPosts.addAll(edges.map((e) => Post.fromEdge(e)).toList());
          emit(
            CurrentUserPaginatedPostsState(
              posts: listOfPosts,
              endCursor: endCursor,
              hasReachedEndOfTheList:
                  result.source == QueryResultSource.network &&
                      endCursor.isEmpty,
            ),
          );
          currentUserPreviousListCount = listOfPosts.length;
        }
      },
    );
  }

  Future<void> refetchCurrentUserPosts() async {
    print('_refetchCurrentUserPosts()');
    if (currentUserPostsRefetch != null) {
      if (!(currentUserObservableQuery?.isRefetchSafe ?? false)) {
        printE('currentUserObservableQuery Not refetch safe');
        add(GetCurrentUserPostsEvent(currentUser!.id, ''));
        return;
      }
      await currentUserPostsRefetch!();
    } else {
      if (currentUser?.id != null) {
        add(GetCurrentUserPostsEvent(currentUser!.id, ''));
      } else {
        printE('_currentUserId = null');
      }
    }
  }

  Future<void> fetchMoreCurrentUserPosts(
    FetchMoreCurrentUserPostsGqlIsolateEvent event,
  ) async {
    if (currentUserPostsFetchMore == null) {
      printE('_currentUserPostsFetchMore() = NULL');
      return;
    }
    if (currentUser?.id == null) {
      printE('_currentUserId = NULL');
      return;
    }
    print('FETCH MORE with cursor ${event.endCursor}');
    Map<String, dynamic> variablesFetchMore;
    variablesFetchMore = {
      'getUserInput': {'id': currentUser!.id},
      'first': 10,
      'after': event.endCursor,
    };
    debugPrint(variablesFetchMore.toString());
    final FetchMoreOptions fetchMoreOptions = FetchMoreOptions(
      variables: variablesFetchMore,
      updateQuery: (
        previousResultData,
        fetchMoreResultData,
      ) {
        fetchMoreResultData?['getUser']['user']['postsConnection']['pageInfo']
                ['startCursor'] =
            previousResultData?['getUser']['user']['postsConnection']
                ['pageInfo']['startCursor'];
        final prevResultEdges = previousResultData?['getUser']['user']
            ['postsConnection']['edges'] as List<dynamic>;
        final moreResultEdges = fetchMoreResultData?['getUser']['user']
            ['postsConnection']['edges'] as List<dynamic>;
        final List<dynamic> edges = [...prevResultEdges, ...moreResultEdges];
        fetchMoreResultData?['getUser']['user']['postsConnection']['edges'] =
            edges;
        return fetchMoreResultData;
      },
    );
    await currentUserPostsFetchMore!(fetchMoreOptions);
  }

  //Current User Notifications
  Future<void> paginateCurrentUserActivities(
    PaginateCurrentUserActivityEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      CurrentUserGqlQueries().paginatedUserActivity,
      operationName: QueryOperations.kPaginateUserActivity,
      variables: event.getVariables(id: currentUser?.id),
    );
    List<UserActivity>? userActivityList;
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    String? endCursor;
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      try {
        final Map<String, dynamic>? activitiesConnection =
            data['getUser']?['user']?['activitiesConnection'];
        if (activitiesConnection != null) {
          endCursor = activitiesConnection['pageInfo']?['endCursor'];
          if (activitiesConnection['edges'] == null) {
            userActivityList = [];
          } else {
            userActivityList = (activitiesConnection['edges'] as List)
                .map((edge) => UserActivity.fromEdge(edge))
                .toList();
          }
        } else {
          printE('activitiesConnection = null');
        }
      } catch (error) {
        printE(error);
        emit(
          PaginatedUserActivityState(
            errorMessage: kSomethingWentWrong,
            activityList: const [],
            endCursor: '',
          ),
        );
        return;
      }
    } else {
      printE(result.exception);
    }
    emit(
      PaginatedUserActivityState(
        errorMessage: errorMessage,
        activityList: userActivityList,
        endCursor: endCursor,
      ),
    );
  }

  Future<void> clearFCMTokenToServer() async {
    emit(
      ClearFCMTokenOnServerGqlIsolateState(
        await updateFCMTokenToServer(
          UpdateFcmTokenToServerGqlIsolateEvent(''),
        ),
      ),
    );
  }

  Future<bool> updateFCMTokenToServer(
    UpdateFCMTokenEvent event,
  ) async {
    final QueryResult res = await gService.performMutationWith(
      MutationOperations.kUpdateFCMToken,
      variables: {
        'input': {'token': event.token},
      },
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, res);
    bool success = false;
    if (errorMessage == null) {
      final data = res.data!;
      if (data['updateFCMToken']['success'] == true) {
        success = true;
      }
    }
    return success;
  }
}
