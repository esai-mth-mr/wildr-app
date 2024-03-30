// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[FollowingsPageGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [FollowingsPageGqlIsolateBlocExt]: $message');
}

extension FollowingsPageGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> getFollowingsList(
    FollowingsTabPaginateMembersListEvent event,
  ) async {
    final QueryResult result = await gService.performMutationWith(
      QueryOperations.kGetFollowingsList,
      variables: event.getVariables(),
    );
    List<WildrUser>? users;
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    String? endCursor;
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final mapFollowersList =
          data['getFollowingsList']?['user']?['followingsList'];
      if (mapFollowersList == null) {
        users = [];
      } else {
        endCursor = mapFollowersList['pageInfo']?['endCursor'];
        if (mapFollowersList['edges'] != null) {
          users = (mapFollowersList['edges'] as List)
              .map((edge) => WildrUser.fromUserObj(edge['node']))
              .toList();
        }
      }
    }
    emit(
      FollowingTabPaginateMembersListState(
        errorMessage: errorMessage,
        users: users,
        endCursor: endCursor,
      ),
    );
  }

  Future<void> followingsPageFollowUser(
    FollowingsTabFollowUserEvent event,
  ) async {
    final result = await gService.performMutationWith(
      MutationOperations.kFollowUser,
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      FollowingsTabFollowCTAState(
        errorMessage == null,
        errorMessage,
        event.index,
        event.userId,
      ),
    );
  }

  Future<void> followingsPageUnfollow(
    FollowingsTabUnfollowUserEvent event,
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
      FollowingsTabUnfollowCTAState(
        errorMessage == null,
        errorMessage,
        event.index,
        event.userId,
      ),
    );
  }
}
