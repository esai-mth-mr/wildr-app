// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/feat_post/post_reactions_list/reaction_list_data.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reaction_list_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reactions_list_state.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('🟢 ReactionsListGqlIsolateBlocExt: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ ReactionsListGqlIsolateBlocExt: $message');
}

extension ReactionsListGqlIsolateBlocExt on GraphqlIsolateBloc {
  Map<String, dynamic> _getReactorsListConnection(
    Map<String, dynamic> data,
    ReactionType reactionType,
  ) {
    switch (reactionType) {
      case ReactionType.REAL:
        return data['getPost']['post']['realReactorsUserListConnection'];
      case ReactionType.APPLAUD:
        return data['getPost']['post']['applaudReactorsUserListConnection'];
      case ReactionType.LIKE:
        return data['getPost']['post']['likeReactorsUserListConnection'];
    }
  }

  List _getReactorsListEdges(
    Map<String, dynamic> data,
    ReactionType reactionType,
  ) =>
      data['edges'] as List;

  List<WildrUser> _getReactorsList(
    Map<String, dynamic> data,
    ReactionType reactionType,
  ) =>
      _getReactorsListEdges(data, reactionType)
          .map((edge) => WildrUser.fromUserObj(edge['node']))
          .toList();

  String _getEndCursor(Map<String, dynamic> data) =>
      data['pageInfo']['endCursor'];

  int _getTotalReactorsCount(Map<String, dynamic> data) => data['count'];

  Future<void> getRealReactorsCount(
    RealReactorsCountEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.getRealReactorsCount(),
      variables: event.getVariables(),
      operationName: QueryOperations.kGetRealReactorsCount,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> reactorsListConnection =
          _getReactorsListConnection(result.data!, ReactionType.REAL);
      final int totalReactorsCount =
          _getTotalReactorsCount(reactorsListConnection);
      emit(RealReactorsCountState(totalCount: totalReactorsCount));
    } else {
      emit(RealReactorsCountState(errorMessage: errorMessage));
    }
  }

  Future<void> getApplaudReactorsCount(
    ApplaudReactorsCountEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.getApplaudReactorsCount(),
      variables: event.getVariables(),
      operationName: QueryOperations.kGetApplaudReactorsCount,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> reactorsListConnection =
          _getReactorsListConnection(result.data!, ReactionType.APPLAUD);
      final int totalReactorsCount =
          _getTotalReactorsCount(reactorsListConnection);
      emit(ApplaudReactorsCountState(totalCount: totalReactorsCount));
    } else {
      emit(ApplaudReactorsCountState(errorMessage: errorMessage));
    }
  }

  Future<void> getLikeReactorsCount(
    LikeReactorsCountEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.getLikeReactorsCount(),
      variables: event.getVariables(),
      operationName: QueryOperations.kGetLikeReactorsCount,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> reactorsListConnection =
          _getReactorsListConnection(result.data!, ReactionType.LIKE);
      final int totalReactorsCount =
          _getTotalReactorsCount(reactorsListConnection);
      emit(LikeReactorsCountState(totalCount: totalReactorsCount));
    } else {
      emit(LikeReactorsCountState(errorMessage: errorMessage));
    }
  }

  Future<void> paginateRealReactorsList(
    PaginateRealReactorsListEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.paginateRealReactors(),
      operationName: QueryOperations.kPaginateRealReactorsList,
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> reactorsListConnection =
          _getReactorsListConnection(result.data!, ReactionType.REAL);
      final String endCursor = _getEndCursor(reactorsListConnection);
      final List<WildrUser> reactorsList =
          _getReactorsList(reactorsListConnection, ReactionType.REAL);
      final int totalReactorsCount =
          _getTotalReactorsCount(reactorsListConnection);
      emit(
        PaginateRealReactorsListState(
          users: reactorsList,
          endCursor: endCursor,
          totalCount: totalReactorsCount,
        ),
      );
    } else {
      emit(PaginateRealReactorsListState(errorMessage: errorMessage));
    }
  }

  Future<void> paginateApplaudReactorsList(
    PaginateApplaudReactorsListEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.paginateApplaudReactors(),
      operationName: QueryOperations.kPaginateApplaudReactorsList,
      variables: event.getVariables(),
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> reactorsListConnection =
          _getReactorsListConnection(result.data!, ReactionType.APPLAUD);
      final String endCursor = _getEndCursor(reactorsListConnection);
      final List<WildrUser> reactorsList =
          _getReactorsList(reactorsListConnection, ReactionType.APPLAUD);
      final int totalReactorsCount =
          _getTotalReactorsCount(reactorsListConnection);
      emit(
        PaginateApplaudReactorsListState(
          users: reactorsList,
          endCursor: endCursor,
          totalCount: totalReactorsCount,
        ),
      );
    } else {
      emit(PaginateApplaudReactorsListState(errorMessage: errorMessage));
    }
  }

  Future<void> paginateLikeReactorsList(
    PaginateLikeReactorsListEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.paginateLikeReactors(),
      operationName: QueryOperations.kPaginateLikeReactorsList,
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    if (errorMessage == null) {
      final Map<String, dynamic> reactorsListConnection =
          _getReactorsListConnection(result.data!, ReactionType.LIKE);
      final String endCursor = _getEndCursor(reactorsListConnection);
      final List<WildrUser> reactorsList =
          _getReactorsList(reactorsListConnection, ReactionType.LIKE);
      final int totalReactorsCount =
          _getTotalReactorsCount(reactorsListConnection);
      emit(
        PaginateLikeReactorsListState(
          users: reactorsList,
          endCursor: endCursor,
          totalCount: totalReactorsCount,
        ),
      );
    } else {
      emit(PaginateLikeReactorsListState(errorMessage: errorMessage));
    }
  }
}
