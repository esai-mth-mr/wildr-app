// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

extension InnerCircleGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> addMemberToInnerCircle(ICAddMemberEvent event) async {
    final result = await gService.performMutation(
      GqlQueriesInnerCircle().addMember,
      operationName: 'addMemberToInnerCircle',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      InnerCircleAddMemberState(
        userId: event.userId,
        index: event.index,
        errorMessage: errorMessage,
        pageId: event.pageId,
      ),
    );
  }

  Future<void> removeMemberFromInnerCircle(
    ICRemoveMemberEvent event,
  ) async {
    final result = await gService.performMutation(
      GqlQueriesInnerCircle().removeMember,
      operationName: 'removeMemberFromInnerCircle',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      InnerCircleRemoveMemberState(
        userId: event.userId,
        index: event.index,
        errorMessage: errorMessage,
        pageId: event.pageId,
      ),
    );
  }

  Future<void> paginateInnerCircle(
    ICPaginateMembersListEvent event,
  ) async {
    final result = await gService.performQuery(
      GqlQueriesInnerCircle().paginate,
      operationName: 'paginateInnerCircleListMembers',
      variables: event.getVariables(currentUser?.id ?? ''),
      fetchPolicy: FetchPolicy.noCache,
    );
    String? errorMessage = getErrorMessageFromResultAndLogEvent(event, result);
    String? endCursor;
    List<WildrUser> users = [];
    bool isSuggestion = false;
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final Map<String, dynamic>? innerCircleListMap =
          data['getUser']?['user']?['innerCircleList'];
      if (innerCircleListMap != null) {
        final Map<String, dynamic>? members = innerCircleListMap['members'];
        isSuggestion = innerCircleListMap['isSuggestion'] ?? false;
        if (members != null) {
          endCursor = innerCircleListMap['members']?['pageInfo']?['endCursor'];
          final List<dynamic>? edges = members['edges'];
          if (edges != null) {
            users = edges
                .map((edge) => WildrUser.fromUserObj(edge['node']))
                .toList();
          } else {
            errorMessage = kSomethingWentWrong;
          }
        } else {
          errorMessage = kSomethingWentWrong;
        }
      }
    }
    emit(
      ICPaginateMembersListState(
        endCursor: endCursor,
        users: users,
        errorMessage: errorMessage,
        isSuggestion: isSuggestion,
      ),
    );
  }
}
