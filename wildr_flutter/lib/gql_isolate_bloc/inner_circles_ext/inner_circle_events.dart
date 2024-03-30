// ignore_for_file: avoid_positional_boolean_parameters

import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/home/model/pagination_input.dart';

class ICRemoveMemberEvent extends MainBlocEvent {
  final String userId;
  final int index;
  final String? pageId;

  ICRemoveMemberEvent(
    this.userId, {
    required this.index,
    this.pageId,
  }) : super();

  Map<String, dynamic> getVariables() => {
      'input': {'memberId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class ICAddMemberEvent extends MainBlocEvent {
  final String userId;
  final int index;
  final String? pageId;

  ICAddMemberEvent(
    this.userId, {
    required this.index,
    this.pageId,
  }) : super();

  Map<String, dynamic> getVariables() => {
      'input': {'memberId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class ICPaginateMembersListEvent extends MainBlocEvent {
  final PaginationInput input;
  final bool isSuggestion;

  ICPaginateMembersListEvent(
    this.input,
    this.isSuggestion,
  );

  ICPaginateMembersListEvent.loadMore(String after, this.isSuggestion)
      : input = PaginationInput(after: after);

  Map<String, dynamic> getVariables(String userId) => {
      'getUserInput': {'id': userId},
      'paginationInput': input.getMap(),
      'isSuggestion': isSuggestion,
    };
}
