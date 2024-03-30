import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class FollowUserEvent extends MainBlocEvent {
  final String userId;
  final int? index;
  final String? pageId;

  FollowUserEvent(this.userId, {this.index, this.pageId}) : super();

  Map<String, dynamic> getVariables() => {
      'followUserInput': {'userId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class UnfollowUserEvent extends MainBlocEvent {
  final String userId;
  final int? index;

  final String? pageId;

  UnfollowUserEvent(this.userId, {this.index, this.pageId}) : super();

  Map<String, dynamic> getVariables() => {
      'unfollowUserInput': {'userId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class RemoveFollowerEvent extends MainBlocEvent {
  final String userId;

  RemoveFollowerEvent(this.userId) : super();

  Map<String, dynamic> getVariables() => {
      'removeFollowerInput': {'userId': userId},
    };
}

class RefreshUserListPageEvent extends MainBlocEvent {
  final String id;

  RefreshUserListPageEvent(this.id);
}
