// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/access_control_context/comment_posting_access_control_context.dart';
import 'package:wildr_flutter/home/model/access_control_context/comment_visibility_access_control_context.dart';
import 'package:wildr_flutter/home/model/comment.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(dynamic message) {
  debugPrint('🟢 CommentsGqlIsolateBlocExt: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ CommentsGqlIsolateBlocExt: $message');
}

extension CommentsGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> addComment(AddCommentEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kAddComment,
      variables: event.getInput(),
      operationName: 'addComment',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    final String? postNotFoundMessage = result.postNotFoundErrorMessage();
    if (postNotFoundMessage != null) {
      emit(
        AddCommentsState(
          event.parentId,
          errorMessage: postNotFoundMessage,
          postNotFound: true,
        ),
      );
    } else if (errorMessage != null) {
      emit(AddCommentsState(event.parentId, errorMessage: errorMessage));
    } else if (result.data != null) {
      final TrollDetectedData? trollDetectedData = result.trollDetectedData();
      if (trollDetectedData == null) {
        emit(
          AddCommentsState(
            event.parentId,
            comment: Comment.fromAddComment(result.data!),
          ),
        );
      } else {
        emit(CommentTrollingDetectedState(trollDetectedData));
      }
    }
  }

  Future<void> reactOnComment(ReactOnCommentEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kReactOnComment,
      variables: event.getInput(),
      operationName: 'ReactOnComment',
      shouldPrintLog: true,
    );
    final bool liked = result.data?['reactOnComment']?['comment']
            ?['commentContext']?['liked'] ??
        false;
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    emit(
      ReactOnCommentState(
        event.commentId,
        liked: liked,
        errorMessage: errorMessage,
      ),
    );
  }

  Future<void> paginateComments(PaginateCommentsEvent event) async {
    QueryResult result;
    result = await gService.performQuery(
      event.getQuery(),
      operationName: QueryOperations.kPaginatedComments,
      variables: event.getInput(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null && result.data != null) {
      final Map<String, dynamic> data = result.data!;
      final String? targetCommentError = _getTargetCommentError(data);
      final Map<String, dynamic>? parentGqlObj =
          data[event.getFunctionName()]?[event.getObjectName()];
      final Map<String, dynamic>? commentsConnectionMap =
          parentGqlObj?['commentsConnection'];
      if (parentGqlObj == null || commentsConnectionMap == null) {
        emit(
          PaginateCommentsState(
            parentId: event.parentId,
            errorMessage: kSomethingWentWrong,
          ),
        );
        return;
      }
      final List<Comment> comments;
      if (event.parentType == ParentType.POST) {
        final edgesMap = commentsConnectionMap['edges'];
        if (edgesMap == null) {
          comments = [];
        } else {
          comments =
              (edgesMap as List).map((e) => Comment.fromEdge(e)).toList();
        }
      } else {
        final ChallengeCommentsConnection challengeCommentsConnection =
            ChallengeCommentsConnection.fromJson(commentsConnectionMap);
        comments = challengeCommentsConnection.comments;
      }
      CommentVisibilityACC? commentVisibilityACC;
      CommentPostingACC? commentPostingAccessControlContext;
      if (event.after == null) {
        final Map<String, dynamic>? commentPostingAccessControlContextMap =
            parentGqlObj['commentPostingAccessControlContext'];
        if (commentPostingAccessControlContextMap != null) {
          commentPostingAccessControlContext =
              CommentPostingACC.fromJson(commentPostingAccessControlContextMap);
        }
        final Map<String, dynamic>? commentVisibilityACCMap =
            parentGqlObj['commentVisibilityAccessControlContext'];
        if (commentVisibilityACCMap != null) {
          commentVisibilityACC =
              CommentVisibilityACC.fromJson(commentVisibilityACCMap);
        }
      }
      final isLoadingAbove = event.before != null;
      final bool shouldShowLoadAboveButton;
      if (event.before != null) {
        shouldShowLoadAboveButton =
            commentsConnectionMap['pageInfo']?['hasNextPage'] ?? false;
      } else if (event.includingAndAfter != null) {
        shouldShowLoadAboveButton =
            commentsConnectionMap['pageInfo']?['hasPreviousPage'] ?? false;
      } else {
        shouldShowLoadAboveButton = false;
      }
      emit(
        PaginateCommentsState(
          parentId: event.parentId,
          comments: comments.toList(),
          isRefreshing: event.isRefreshing,
          isLoadingAbove: isLoadingAbove,
          shouldShowLoadAboveButton: shouldShowLoadAboveButton,
          commentPostingACC: commentPostingAccessControlContext,
          commentVisibilityACC: commentVisibilityACC,
          targetCommentError: targetCommentError,
        ),
      );
    } else {
      emit(
        PaginateCommentsState(
          parentId: event.parentId,
          errorMessage: errorMessage,
        ),
      );
    }
  }

  String? _getTargetCommentError(Map<String, dynamic> data) =>
      data['getPost']?['post']?['commentsConnection']?['targetCommentError'];

  Future<void> pinComment(PinCommentEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kPinComment,
      operationName: MutationOperations.kPinComment,
      variables: event.getInput(),
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      PinACommentResult(
        event.parentId,
        errorMessage,
        event.index,
        event.commentBeingUnpinned,
      ),
    );
  }

  Future<void> deleteComment(DeleteCommentEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kDeleteComment,
      variables: event.getInput(),
      operationName: 'deleteComment',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    bool isSuccessful = false;
    if (errorMessage == null) {
      if (result.data != null) {
        isSuccessful = result.data?['deleteComment']['isSuccessful'] ?? false;
      }
    }
    emit(
      DeleteCommentState(
        event.parentPostId,
        isSuccessful: isSuccessful,
        errorMessage: errorMessage,
        index: event.index,
        commentId: event.commentId,
      ),
    );
  }

  Future<void> paginateCommentLikes(PaginateCommentLikesEvent event) async {
    print(event.commentId);

    final result = await gService.performQuery(
      CommentsGqlQueries.getComment,
      operationName: 'GetComment',
      variables: event.getVariables(),
      shouldPrintLog: true,
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    final List<dynamic>? edges = result.data?['getComment']?['comment']
        ?['reactionsConnection']?['edges'];
    final users = edges?.map((edge) => WildrUser.fromJson(edge['node'])) ?? [];

    emit(
      PaginateCommentLikesState(
        errorMessage: errorMessage,
        users: users.toList(),
      ),
    );
  }

  Future<void> flagComment(FlagCommentEvent event) async {
    final QueryResult result = await gService.performMutation(
      event.query,
      variables: event.getVariables(),
      operationName: 'flagComment',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      FlagCommentState(
        errorMessage: errorMessage,
        index: event.index,
        commentId: event.commentId,
        operation: event.operation,
      ),
    );
  }

  Future<void> blockCommenterOnPost(BlockCommenterOnPostEvent event) async {
    final QueryResult result = await gService.performMutation(
      event.query,
      variables: event.getVariables(),
      operationName: 'blockCommenterOnPost',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      BlockCommenterOnPostState(
        errorMessage: errorMessage,
        operation: event.operation,
        handle: event.handle,
      ),
    );
  }

  Future<void> updateCommentParticipationTypeEvent(
    UpdateCommentParticipationTypeEvent event,
  ) async {
    final QueryResult result = await gService.performMutation(
      event.query,
      variables: event.getVariables(),
      operationName: 'updateCommentParticipationType',
      shouldPrintLog: true,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      UpdateCommentParticipationTypeResult(
        errorMessage: errorMessage,
        index: event.index,
        previousCommentState: event.previousCommentState,
        isSuccessful: errorMessage == null,
      ),
    );
  }
}
