// ignore_for_file: cascade_invocations, avoid_positional_boolean_parameters

import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_queries.dart';
import 'package:wildr_flutter/home/model/comment.dart';

class AddCommentEvent extends MainBlocEvent {
  final String data;
  final String parentId;

  final bool shouldBypassTrollDetection;
  final double? negativeConfidenceCount;
  late final ParentType parentType;

  AddCommentEvent(
    this.data,
    this.parentId, {
    this.shouldBypassTrollDetection = false,
    this.negativeConfidenceCount,
    required Type type,
  }) : super() {
    if (type == Challenge) {
      parentType = ParentType.CHALLENGE;
    } else {
      parentType = ParentType.POST;
    }
  }

  Map<String, dynamic> getInput() {
    final Map<String, dynamic> input = {
      parentType.key: parentId,
      'participationType': CommentParticipationTypeEnum.OPEN.value(),
    };
    input.addAll(SmartTextCommon().createContentForSubmission(data));
    if (shouldBypassTrollDetection) {
      input['shouldBypassTrollDetection'] = true;
      input['negativeConfidenceCount'] = negativeConfidenceCount;
    }
    return {'addCommentInput': input};
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kPostId: parentId,
        AnalyticsParameters.kShouldBypassTrollDetection:
            shouldBypassTrollDetection.toString(),
        AnalyticsParameters.kNegativeConfidenceCount:
            negativeConfidenceCount.toString(),
        AnalyticsParameters.kType: parentType.toString().split('.').last,
      };
}

class ReactOnCommentEvent extends MainBlocEvent {
  final String commentId;
  final bool liked;
  final bool isChallenge;

  ReactOnCommentEvent(
    this.commentId, {
    required this.liked,
    required this.isChallenge,
  }) : super();

  Map<String, dynamic> getInput() => {
        'reactOnCommentInput': {
          'commentId': commentId,
          'reaction': liked ? 'LIKE' : 'UN_LIKE',
        },
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commentId,
        AnalyticsParameters.kReactionType: liked ? 'LIKE' : 'UN_LIKE',
        AnalyticsParameters.kType: isChallenge ? 'CHALLENGE' : 'POST',
      };
}

class PinCommentEvent extends MainBlocEvent {
  final int? index;
  final String commentId;
  final String parentId;
  final Comment? commentBeingUnpinned;
  late final ParentType parentType;

  PinCommentEvent(
    this.parentId,
    this.commentId, {
    this.index,
    this.commentBeingUnpinned,
    required Type type,
  }) : super() {
    if (type == Challenge) {
      parentType = ParentType.CHALLENGE;
    } else {
      parentType = ParentType.POST;
    }
  }

  Map<String, dynamic> getInput() => {
        'pinCommentInput': {
          parentType.key: parentId,
          'commentId': commentId,
        },
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commentId,
        AnalyticsParameters.kPostId: parentId,
        AnalyticsParameters.kType: parentType.toString().split('.').last,
      };
}

class UpdateCommentParticipationTypeEvent extends MainBlocEvent {
  ///Pass the comment that you would like to go back to in case things go south!
  final Comment previousCommentState;
  final String commentId;
  final int index;
  final CommentParticipationTypeEnum typeEnum;

  UpdateCommentParticipationTypeEvent(
    this.commentId,
    this.index,
    this.typeEnum,
    this.previousCommentState,
  );

  Map<String, dynamic> getVariables() => {
        'updateCommentParticipationTypeInput': {
          'commentId': commentId,
          'type': typeEnum.value(),
        },
      };

  String get query => r'''
    mutation updateCommentParticipationType($updateCommentParticipationTypeInput: UpdateCommentParticipationInput!){
      updateCommentParticipation(input: $updateCommentParticipationTypeInput){
        ...on UpdateCommentParticipationResult {
          comment{
            id
          }
        }
        ... on SmartError {
          message
        }
      }
    }
    ''';
}

enum ParentType { POST, CHALLENGE }

extension GetKey on ParentType {
  String get key {
    switch (this) {
      case ParentType.POST:
        return 'postId';
      case ParentType.CHALLENGE:
        return 'challengeId';
    }
  }
}

class PaginateCommentsEvent extends MainBlocEvent {
  final String parentId;
  final int fetchCount;
  final bool isRefreshing;
  final String? after;
  final int? last;
  final String? before;
  final String? includingAndAfter;
  final String? targetCommentId;
  late final ParentType parentType;

  PaginateCommentsEvent(
    this.parentId,
    this.fetchCount, {
    required this.isRefreshing,
    this.after,
    this.before,
    this.last,
    this.includingAndAfter,
    this.targetCommentId,
    required Type type,
  }) : super() {
    if (type == Challenge) {
      parentType = ParentType.CHALLENGE;
    } else {
      parentType = ParentType.POST;
    }
  }

  Map<String, dynamic> _input() {
    if (parentType == ParentType.POST) {
      return {
        parentType.key: parentId,
        'first': fetchCount,
        'includingAndAfter': includingAndAfter,
        'targetCommentId': targetCommentId,
      };
    } else {
      return {
        parentType.key: parentId,
        'paginationInput': {
          'take': fetchCount,
          'after': after,
          'before': before,
          'includingAndAfter': includingAndAfter,
        },
        'targetCommentId': targetCommentId,
      };
    }
  }

  String getFunctionName() {
    switch (parentType) {
      case ParentType.POST:
        return 'getPost';
      case ParentType.CHALLENGE:
        return 'getChallenge';
    }
  }

  String getObjectName() {
    switch (parentType) {
      case ParentType.POST:
        return 'post';
      case ParentType.CHALLENGE:
        return 'challenge';
    }
  }

  Map<String, dynamic> getInput() {
    switch (parentType) {
      case ParentType.POST:
        if (isRefreshing) {
          return _input();
        }
        final input = _input();
        if (after != null) {
          input['after'] = after!;
        }
        if (before != null) {
          input['before'] = before!;
        }

        if (last != null) {
          input['last'] = last!;
        }
        return input;
      case ParentType.CHALLENGE:
        return _input();
    }
  }

  String getQuery() {
    switch (parentType) {
      case ParentType.POST:
        if (after == null) {
          return CommentsGqlQueries().paginateCommentsOnPost;
        } else {
          return CommentsGqlQueries().paginatedCommentsWithoutCanCommentStatus;
        }
      case ParentType.CHALLENGE:
        return CommentsGqlQueries().paginateCommentsOnChallenge;
    }
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kPostId: parentId,
      };
}

class PaginateCommentLikesEvent extends MainBlocEvent {
  final String commentId;
  final int take;

  PaginateCommentLikesEvent(this.commentId, this.take) : super();

  Map<String, dynamic> getVariables() => {
        'getCommentInput': {'id': commentId},
        'reactionType': 'LIKE',
        'paginationInput': {'take': take},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commentId,
      };
}

class BlockCommenterOnPostEvent extends MainBlocEvent {
  final CommenterBlockOperation operation;
  final String commenterId;
  final String postId;
  final String handle;

  BlockCommenterOnPostEvent({
    required this.operation,
    required this.commenterId,
    required this.postId,
    required this.handle,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commenterId,
        AnalyticsParameters.kCommenterBlockOperation: operation.name,
        AnalyticsParameters.kPostId: postId,
      };

  Map<String, dynamic> getVariables() => {
        'input': {
          'commenterId': commenterId,
          'operation': operation.name,
          'postId': postId,
        },
      };

  String get query => r'''
  mutation blockCommenterOnPost($input: BlockCommenterOnPostInput!) {
    blockCommenterOnPost(input: $input) {
      __typename
      ... on BlockCommenterOnPostResult {
        __typename
        operation
        commenterId
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
  ''';
}

class FlagCommentEvent extends MainBlocEvent {
  final String commentId;
  final int index;
  final FlagCommentOperation operation;

  FlagCommentEvent({
    required this.commentId,
    required this.operation,
    required this.index,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commentId,
        AnalyticsParameters.kFlagCommentOperation: operation.name,
      };

  Map<String, dynamic> getVariables() => {
        'flagCommentInput': {
          'commentId': commentId,
          'operation': operation.name,
        },
      };

  String get query => r'''
  mutation flagComment($flagCommentInput: FlagCommentInput!) {
    flagComment(input: $flagCommentInput) {
      __typename
      ... on FlagCommentResult {
        __typename
        comment {
          __typename
          id
        }
        parentPost {
          __typename
          id
          stats {
            __typename
            likeCount
            realCount
            applauseCount
            shareCount
            repostCount
            commentCount
            reportCount
          }
        }
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
  ''';
}

enum FlagCommentOperation { FLAG, UN_FLAG }

enum CommenterBlockOperation { BLOCK, UN_BLOCK }
