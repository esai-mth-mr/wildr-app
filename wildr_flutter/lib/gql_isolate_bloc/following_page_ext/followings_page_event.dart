import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class FollowingsTabFollowUserEvent extends MainBlocEvent {
  final String userId;
  final int? index;

  FollowingsTabFollowUserEvent(this.userId, {this.index}) : super();

  Map<String, dynamic> getVariables() => {
      'followUserInput': {'userId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class FollowingsTabUnfollowUserEvent extends MainBlocEvent {
  final String userId;
  final int? index;

  FollowingsTabUnfollowUserEvent(this.userId, {this.index}) : super();

  Map<String, dynamic> getVariables() => {
      'unfollowUserInput': {'userId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class FollowingsTabRemoveFollowerEvent extends MainBlocEvent {
  final String userId;

  FollowingsTabRemoveFollowerEvent(this.userId) : super();

  Map<String, dynamic> getVariables() => {
      'removeFollowerInput': {'userId': userId},
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}

class FollowingsTabPaginateMembersListEvent extends MainBlocEvent {
  final String userId;
  final int? first;
  final int? last;
  final String? after;
  final String? before;

  FollowingsTabPaginateMembersListEvent(
    this.userId, {
    this.first = DEFAULT_FIRST_COUNT,
    this.last,
    this.after,
    this.before,
  });

  FollowingsTabPaginateMembersListEvent.loadMore(this.userId, this.after)
      : first = DEFAULT_FIRST_COUNT,
        before = null,
        last = null;

  Map<String, dynamic> getVariables() => {
      'input': {
        'userId': userId,
      },
      'first': first,
      'last': last,
      'after': after,
      'before': before,
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kUserId: userId,
    };
}
