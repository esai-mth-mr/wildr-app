// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_visible_for_testing_member, invalid_use_of_protected_member

import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_state.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[PostGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [PostGqlIsolateBlocExt]: $message');
}

extension ProfilePageGraphqlIsolateBlocExtension on GraphqlIsolateBloc {
  Future<void> fetchUserDetails(FetchUserDetailsEvent event) async {
    final variables = {
      'getUserInput': {'id': event.idOfUserToFetch},
    };
    final result = await gService.performQuery(
      GQueries.getUser(),
      variables: variables,
      operationName: 'getUser',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      if (result.data != null) {
        emit(
          ProfileLoadSuccessful(
            WildrUser.fromData(result.data!),
            pageId: event.pageId,
          ),
        );
      }
    } else {
      emit(
        ProfileLoadFailed(
          errorMessage,
          pageId: event.pageId,
        ),
      );
    }
  }

  Future<void> refetchUserPosts(RefreshUserPostsEvent event) async {
    debugPrint('refetchUserPosts()');
    final Refetch? refetch = profilePageRefetchFunctions[event.pageId];
    if (refetch == null) {
      printE('refetch = null');
      return;
    }
    await refetch();
  }

  Future<void> fetchMoreUserPosts(PaginateUserPostsEvent event) async {
    debugPrint('fetchMoreUserPosts()');
    final FetchMore? fetchMore = profilePageFetchMoreFunctions[event.pageId];
    if (fetchMore == null) {
      printE('fetchMore = null');
      return;
    }
    final Map<String, dynamic> variablesFetchMore = {
      'getUserInput': {'id': event.userId},
      'first': 20,
      'after': event.endCursor,
    };
    debugPrint('Fetch more variables $variablesFetchMore');
    await fetchMore(
      FetchMoreOptions(
        variables: variablesFetchMore,
        updateQuery: (
          previousResultData,
          fetchMoreResultData,
        ) {
          fetchMoreResultData?['getUser']['user']['postsConnection']['pageInfo']
                  ['startCursor'] =
              previousResultData?['getUser']['user']['postsConnection']
                  ['pageInfo']['startCursor'];
          final List<dynamic> edges = [
            ...previousResultData?['getUser']['user']['postsConnection']
                ['edges'] as List<dynamic>,
            ...fetchMoreResultData?['getUser']['user']['postsConnection']
                ['edges'] as List<dynamic>,
          ];
          fetchMoreResultData?['getUser']['user']['postsConnection']['edges'] =
              edges;
          print('EDGE LENGTH ${edges.length}');
          return fetchMoreResultData;
        },
      ),
    );
  }

  Future<void> getUserPosts(GetUserPostsEvent event) async {
    final variables = {
      'getUserInput': {'id': event.idOfUser},
      'first': 10,
    };
    final ObservableQuery? observableQuery = gService.performWatchQuery(
      GQueries.kPaginatedUserPosts,
      variables: variables,
      operationName: 'paginatedUserPosts',
    );
    if (observableQuery == null) {
      emit(ProfileLoadFailed(kSomethingWentWrong, pageId: event.pageId));
      return;
    }
    debugPrint(
      'OBSERVABLE QUERY VARIABLES = ${observableQuery.options.variables}',
    );
    profilePagePostsStreamSubscriptions[event.pageId] =
        observableQuery.stream.listen((result) {
      if (result.isLoading) {
        print('IS LOADING');
        emit(ProfileLoading(event.pageId));
      } else if (result.data != null) {
        print('GOT DATA');
        final String? errorMessage =
            getErrorMessageFromResultAndLogEvent(event, result);
        if (errorMessage != null) {
          log(result.data.toString());
          emit(ProfileLoadFailed(errorMessage, pageId: event.pageId));
          return;
        }
        final Map<String, dynamic> data = result.data!;
        final Map<String, dynamic>? pc =
            data['getUser']?['user']?['postsConnection'];
        if (pc == null) {
          // emit(ProfileLoadFailed(kSomethingWentWrong, pageId: event.pageId));
          printE('postsConnection = null ${event.idOfUser}');
          return;
        }
        final String endCursor = pc['pageInfo']?['endCursor'] ?? '';
        final List<Post> listOfPosts = _getListOfPosts(pc);
        emit(
          UserPageFeedUpdateState(
            posts: listOfPosts,
            endCursor: endCursor,
            hasReachedEndOfTheList:
                result.source == QueryResultSource.network && endCursor.isEmpty,
            source: result.source,
            pageId: event.pageId,
          ),
        );
      }
    });
    profilePageFetchMoreFunctions[event.pageId] = observableQuery.fetchMore;
    profilePageRefetchFunctions[event.pageId] = observableQuery.refetch;
  }

  Future<void> blockUser(BlockUserEvent event) async {
    final result = await gService.performMutationWith(
      MutationOperations.kBlockUser,
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(BlockUserState(errorMessage, pageId: event.pageId));
  }

  Future<void> unblockUser(UnblockUserEvent event) async {
    final result = await gService.performMutationWith(
      MutationOperations.kUnblockUser,
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(UnblockUserState(errorMessage, pageId: event.pageId));
  }

  //Helpers
  List _getFeedEdges(Map<String, dynamic> data) => data['edges'] as List;

  List<Post> _getListOfPosts(Map<String, dynamic> data) =>
      _getFeedEdges(data).map((e) => Post.fromEdge(e)).toList();

  Future<void> updateListVisibility(UpdateListVisibilityEvent event) async {
    final result = await gService.performMutation(
      GqlQueriesProfilePage().updateListVisibility,
      operationName: 'updateListVisibility',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(UpdateListVisibilityState(errorMessage: errorMessage));
  }

  Future<void> isEmailVerified(IsEmailVerifiedEvent event) async {
    final result = await gService.performQuery(
      GqlQueriesProfilePage().isEmailVerified,
      operationName: 'isEmailVerified',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      IsEmailVerifiedState(
        isEmailVerified:
            result.data?['isEmailVerified']?['isEmailVerified'] ?? false,
        errorMessage: errorMessage,
      ),
    );
  }
}
