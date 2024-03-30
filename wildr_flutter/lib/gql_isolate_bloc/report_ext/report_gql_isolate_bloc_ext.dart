// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/feat_notifications/model/review_report_request.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_state.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

extension ReportGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> reportUser(ReportUserEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kReportUser,
      variables: event.getInput(),
      operationName: 'reportUser',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(ReportUserState(errorMessage: errorMessage));
  }

  Future<void> reportComment(ReportCommentEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kReportComment,
      variables: event.getInput(),
      operationName: 'reportComment',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      ReportCommentState(
        event.parentPostId,
        errorMessage: errorMessage,
      ),
    );
  }

  Future<void> reportReply(ReportReplyEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kReportReply,
      variables: event.getInput(),
      operationName: 'reportReply',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(
      ReportReplyState(
        event.parentCommentId,
        errorMessage: errorMessage,
      ),
    );
  }

  Future<void> reportPost(ReportPostEvent event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kReportPost,
      operationName: MutationOperations.kReportPost,
      variables: event.getInput(),
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(ReportPostState(errorMessage: errorMessage));
  }

  Future<void> getStrikeReport(GetStrikeReportEvent event) async {
    final QueryResult result = await gService.performQuery(
      GqlQueriesReport.kGetStrikeReport,
      variables: event.getInput(),
      operationName: 'getStrikeReport',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      emit(
        StrikeReportState(
          reviewReportRequest: ReviewReportRequest.fromJson(
            result.data!['getStrikeReport'],
          ),
        ),
      );
      return;
    }
    emit(StrikeReportState(errorMessage: errorMessage));
  }
}
