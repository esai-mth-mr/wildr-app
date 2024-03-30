import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_notifications/model/review_report_request.dart';

class ReportSomethingState extends MainState {
  final String? errorMessage;

  ReportSomethingState({this.errorMessage});
}

class ReportUserState extends ReportSomethingState {
  final bool isSuccessful;

  ReportUserState({super.errorMessage})
      : isSuccessful = errorMessage == null;
}

class ReportCommentState extends ReportSomethingState {
  final String parentPostId;
  final bool isSuccessful;

  ReportCommentState(this.parentPostId, {super.errorMessage})
      : isSuccessful = errorMessage == null;
}

class ReportReplyState extends ReportSomethingState {
  final String parentCommentId;
  final bool isSuccessful;

  ReportReplyState(this.parentCommentId, {super.errorMessage})
      : isSuccessful = errorMessage == null;
}

class ReportPostState extends ReportSomethingState {
  final bool isSuccessful;

  ReportPostState({super.errorMessage})
      : isSuccessful = errorMessage == null;
}

class StrikeReportState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;
  final ReviewReportRequest? reviewReportRequest;

  StrikeReportState({this.errorMessage, this.reviewReportRequest})
      : isSuccessful = errorMessage == null;
}
