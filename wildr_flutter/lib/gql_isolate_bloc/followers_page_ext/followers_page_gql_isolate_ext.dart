// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[FollowersPageGqlIsolateExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [FollowersPageGqlIsolateExt]: $message');
}

extension FollowersPageGqlIsolateExt on GraphqlIsolateBloc {
  Future<void> followersPageFollowUserEventToState(
    FollowersTabFollowUserEvent event,
  ) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kFollowUser,
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      FollowersTabFollowState(
        isSuccessful: errorMessage == null,
        errorMessage,
        event.index,
        event.userId,
      ),
    );
  }

  Future<void> followersPageUnfollowUserEventToState(
    FollowersTabUnfollowUserEvent event,
  ) async {
    final result = await gService.performMutation(
      GQueries.unfollow,
      operationName: MutationOperations.kUnfollowUser,
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      FollowersTabUnfollowState(
        isSuccessful: errorMessage == null,
        errorMessage,
        event.index,
        event.userId,
      ),
    );
  }

  Future<void> followersPageRemoveFollower(
    FollowersTabRemoveFollowerEvent event,
  ) async {
    final result = await gService.performMutation(
      FollowUnfollowQueries().removeFollowerMutation,
      operationName: MutationOperations.kRemoveFollower,
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      RemoveFollowerState(
        isSuccessful: errorMessage == null,
        errorMessage,
        event.index,
        event.userId,
      ),
    );
  }

  Future<void> getFollowersList(
    FollowersTabPaginateMembersListEvent event,
  ) async {
    print('getFollowersList...');
    final QueryResult result = await gService.performQuery(
      event.query(),
      operationName: QueryOperations.kGetFollowersList,
      variables: event.getVariables(),
    );
    print('getFollowersList... RESULT');
    List<WildrUser>? users;
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    String? endCursor;
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final mapFollowersList =
          data['getFollowersList']['user']['followersList'];
      if (mapFollowersList == null) {
        users = [];
      } else {
        endCursor = mapFollowersList?['pageInfo']?['endCursor'];
        if (mapFollowersList['edges'] != null) {
          users = (mapFollowersList['edges'] as List)
              .map((edge) => WildrUser.fromUserObj(edge['node']))
              .toList();
        } else {
          users = [];
        }
      }
    }
    emit(
      FollowersTabPaginateMembersListState(
        errorMessage: errorMessage,
        users: users,
        endCursor: endCursor,
      ),
    );
  }
}
