// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/reply_queries.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/home/model/reply.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('[RepliesGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [RepliesGqlIsolateBlocExt]: $message');
}

extension RepliesGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> addReply(AddReplyEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kAddReply,
      variables: event.getInput(),
    );
    debugPrint(event.getInput().toString());
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      if (result.data != null) {
        final TrollDetectedData? trollDetectedData = result.trollDetectedData();
        if (trollDetectedData == null) {
          emit(
            AddReplyState(
              event.commentId,
              reply: Reply.fromAddReply(result.data!, event.commentId),
            ),
          );
        } else {
          emit(ReplyTrollingDetectedState(trollDetectedData));
        }
        return;
      }
    }
    emit(AddReplyState(event.commentId, errorMessage: errorMessage));
  }

  Future<void> reactOnReply(ReactOnReplyEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kReactOnReply,
      variables: event.getInput(),
      operationName: 'ReactOnReply',
      shouldPrintLog: true,
    );

    final bool liked = result.data?['reactOnReply']?['reply']?['replyContext']
            ?['liked'] ??
        false;
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    emit(
      ReactOnReplyState(
        event.replyId,
        liked: liked,
        errorMessage: errorMessage,
      ),
    );
  }

  String? _getTargetReplyError(Map<String, dynamic> data) =>
      data['getComment']?['comment']?['repliesConnection']?['targetReplyError'];

  Future<void> paginateReplies(PaginateRepliesEvent event) async {
    final QueryResult result = await gService.performQuery(
      ReplyGqlQueries().paginateReplies,
      operationName: 'paginatedReplies',
      variables: event.getInput(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null || result.data == null) {
      emit(
        PaginateRepliesState(
          parentCommentId: event.commentId,
          errorMessage: errorMessage ?? kSomethingWentWrong,
        ),
      );
      return;
    }
    final Map<String, dynamic> data = result.data!;
    final list = _getReplyEdges(data).map((e) => Reply.fromEdge(e)).toList();
    final hasPreviousPage = (event.targetReplyId != null)
        ? (data['getComment']?['comment']?['repliesConnection']?['pageInfo']
                ?['hasPreviousPage'] ??
            false)
        : false;
    final hasNextPage = (event.targetReplyId != null)
        ? (data['getComment']?['comment']?['repliesConnection']?['pageInfo']
                ?['hasNextPage'] ??
            false)
        : false;
    final String? targetReplyError = _getTargetReplyError(data);
    emit(
      PaginateRepliesState(
        parentCommentId: event.commentId,
        errorMessage: errorMessage,
        isRefreshing: event.isRefreshing,
        replies: list.toList(),
        isLoadingAbove: event.before != null,
        hasPreviousPage: hasPreviousPage,
        hasNextPage: hasNextPage,
        targetReplyError: targetReplyError,
      ),
    );
  }

  Future<void> deleteReply(DeleteReplyEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kDeleteReply,
      variables: event.getInput(),
      operationName: 'deleteReply',
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    final bool isSuccessful = errorMessage == null;
    emit(
      DeleteReplyState(
        event.parentCommentId,
        isSuccessful: isSuccessful,
        errorMessage: errorMessage,
        index: event.index,
        replyId: event.replyId,
      ),
    );
  }

  List _getReplyEdges(Map<String, dynamic> data) {
    if (data['getComment']?['comment']?['repliesConnection']?['edges'] ==
        null) {
      return [];
    }
    return data['getComment']['comment']['repliesConnection']['edges'] as List;
  }

  Future<void> paginateReplyLikes(PaginateReplyLikesEvent event) async {
    final result = await gService.performQuery(
      ReplyGqlQueries.getReply,
      operationName: 'GetReply',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    final List<dynamic>? edges =
        result.data?['getReply']?['reply']?['reactionsConnection']?['edges'];
    final users = edges?.map((edge) => WildrUser.fromJson(edge['node'])) ?? [];

    emit(
      PaginateReplyLikesState(
        errorMessage: errorMessage,
        users: users.toList(),
      ),
    );
  }
}
