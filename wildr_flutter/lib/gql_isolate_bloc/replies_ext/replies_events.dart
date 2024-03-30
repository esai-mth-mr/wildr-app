import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';

class DeleteReplyEvent extends MainBlocEvent {
  final String parentCommentId;
  final String replyId;
  final int index;

  DeleteReplyEvent(this.parentCommentId, this.replyId, this.index);

  Map<String, dynamic> getInput() => {
        'deleteReplyInput': {'replyId': replyId},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: parentCommentId,
        AnalyticsParameters.kReplyId: replyId,
      };
}

class AddReplyEvent extends MainBlocEvent {
  final String data;
  final String commentId;
  final bool shouldBypassTrollDetection;
  final double? negativeConfidenceCount;

  AddReplyEvent(
    this.data,
    this.commentId, {
    this.shouldBypassTrollDetection = false,
    this.negativeConfidenceCount,
  }) : super();

  Map<String, dynamic> getInput() {
    final Map<String, dynamic> input = {
      'commentId': commentId,
    };
    // ignore: cascade_invocations
    input.addAll(SmartTextCommon().createContentForSubmission(data));

    if (shouldBypassTrollDetection) {
      input['shouldBypassTrollDetection'] = true;
      input['negativeConfidenceCount'] = negativeConfidenceCount;
    }

    return {'addReplyInput': input};
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commentId,
        AnalyticsParameters.kShouldBypassTrollDetection:
            shouldBypassTrollDetection.toString(),
        AnalyticsParameters.kNegativeConfidenceCount:
            negativeConfidenceCount.toString(),
      };
}

class ReactOnReplyEvent extends MainBlocEvent {
  final String replyId;
  final bool liked;

  // ignore: avoid_positional_boolean_parameters
  ReactOnReplyEvent({required this.replyId, required this.liked}) : super();

  Map<String, dynamic> getInput() => {
        'reactOnReplyInput': {
          'replyId': replyId,
          'reaction': liked ? 'LIKE' : 'UN_LIKE',
        },
      };
}

class PaginateRepliesEvent extends MainBlocEvent {
  final String commentId;
  final int fetchCount;
  final bool isRefreshing;

  final String? after;
  final int? last;
  final String? before;
  final String? includingAndAfter;
  final String? includingAndBefore;
  final String? targetReplyId;

  PaginateRepliesEvent(
    this.commentId,
    this.fetchCount, {
    required this.isRefreshing,
    this.after,
    this.before,
    this.last,
    this.includingAndAfter,
    this.includingAndBefore,
    this.targetReplyId,
  }) : super();

  Map<String, dynamic> _input() => {
        'commentId': commentId,
        'first': fetchCount,
        'includingAndAfter': includingAndAfter,
        'includingAndBefore': includingAndBefore,
        'targetReplyId': targetReplyId,
      };

  Map<String, dynamic> getInput() {
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
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kCommentId: commentId,
      };
}

class PaginateReplyLikesEvent extends MainBlocEvent {
  final String replyId;
  final int take;

  PaginateReplyLikesEvent(this.replyId, this.take) : super();

  Map<String, dynamic> getVariables() => {
        'getReplyInput': {'id': replyId},
        'reactionType': 'LIKE',
        'paginationInput': {'take': take},
      };
}
