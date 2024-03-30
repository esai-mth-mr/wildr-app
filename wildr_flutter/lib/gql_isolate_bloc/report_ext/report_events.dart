import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';

class ReportUserEvent extends MainBlocEvent {
  final String userId;
  final ReportUserEnum type;

  ReportUserEvent(this.userId, this.type);

  Map<String, dynamic> getInput() => {
      'reportUserInput': {'userId': userId, 'type': type.value()},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
      AnalyticsParameters.kReportType: type.name,
    };
}

class ReportCommentEvent extends MainBlocEvent {
  final String parentPostId;
  final String commentId;
  final ReportTypeEnum type;

  ReportCommentEvent(this.parentPostId, this.commentId, this.type);

  Map<String, dynamic> getInput() => {
      'reportCommentInput': {'commentId': commentId, 'type': type.value()},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kPostId: parentPostId,
      AnalyticsParameters.kCommentId: commentId,
      AnalyticsParameters.kReportType: type.name,
    };
}

class ReportReplyEvent extends MainBlocEvent {
  final String parentCommentId;
  final String replyId;
  final ReportTypeEnum type;

  ReportReplyEvent(this.parentCommentId, this.replyId, this.type);

  Map<String, dynamic> getInput() => {
      'reportReplyInput': {'replyId': replyId, 'type': type.value()},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kReplyId: parentCommentId,
      AnalyticsParameters.kCommentId: parentCommentId,
      AnalyticsParameters.kReportType: type.name,
    };
}

class ReportPostEvent extends MainBlocEvent {
  final String postId;
  final String type;

  ReportPostEvent(this.postId, ReportTypeEnum type) : type = type.name;

  Map<String, dynamic> getInput() => {
      'reportPostInput': {'postId': postId, 'type': type},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kPostId: postId,
      AnalyticsParameters.kReportType: type,
    };
}

class GetStrikeReportEvent extends MainBlocEvent {
  final String id;

  GetStrikeReportEvent(this.id);

  Map<String, dynamic> getInput() => {
      'getStrikeReportInput': {
        'id': id,
      },
    };
}
