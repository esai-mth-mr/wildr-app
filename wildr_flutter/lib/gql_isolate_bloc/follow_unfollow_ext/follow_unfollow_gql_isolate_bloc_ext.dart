// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

void print(dynamic message) {
  debugPrint('[FollowUnfollowGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [FollowUnfollowGqlIsolateBlocExt]: $message');
}

extension FollowUnfollowGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> followUser(FollowUserEvent event) async {
    final result = await gService.performMutation(
      FollowUnfollowQueries().followUserMutation,
      operationName: FollowUnfollowQueries().followUserOperationName,
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      FollowCTAState(
        errorMessage,
        index: event.index,
        pageId: event.pageId,
        userId: event.userId,
      ),
    );
  }

  Future<void> unfollowUser(UnfollowUserEvent event) async {
    final result = await gService.performMutation(
      GQueries.unfollow,
      operationName: MutationOperations.kUnfollowUser,
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      UnfollowCTAState(
        errorMessage,
        index: event.index,
        pageId: event.pageId,
        userId: event.userId,
      ),
    );
  }
}
