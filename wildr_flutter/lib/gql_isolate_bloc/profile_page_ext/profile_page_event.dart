//class ProfilePageLoadingEvent extends HomeEvent {}

import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/list_visibility.dart';

class FetchUserDetailsEvent extends MainBlocEvent {
  final String idOfUserToFetch;
  final String pageId;

  FetchUserDetailsEvent({required this.pageId, required this.idOfUserToFetch})
      : super();

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kUserId: idOfUserToFetch};
}

class RefreshUserPostsEvent extends MainBlocEvent {
  final String pageId;

  RefreshUserPostsEvent(this.pageId);
}

class PaginateUserPostsEvent extends MainBlocEvent {
  final String pageId;
  final String endCursor;
  final String userId;

  PaginateUserPostsEvent({
    required this.pageId,
    required this.userId,
    required this.endCursor,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kUserId: userId};
}

class GetUserPostsEvent extends MainBlocEvent {
  final String pageId;
  final String idOfUser;

  GetUserPostsEvent({required this.pageId, required this.idOfUser}) : super();

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {AnalyticsParameters.kUserId: idOfUser};
}

//Block UnBlock
class BlockUserEvent extends MainBlocEvent {
  final String userId;
  final String pageId;

  BlockUserEvent(this.userId, {required this.pageId}) : super();

  Map<String, dynamic> getVariables() => {
        'blockUserInput': {'userId': userId},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kUserId: userId,
      };
}

class UnblockUserEvent extends MainBlocEvent {
  final String userId;
  final String pageId;

  UnblockUserEvent(this.userId, {required this.pageId}) : super();

  Map<String, dynamic> getVariables() => {
        'unblockUserInput': {'userId': userId},
      };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kUserId: userId,
      };
}

class UpdateListVisibilityEvent extends MainBlocEvent {
  final ListVisibility listVisibility;

  UpdateListVisibilityEvent(this.listVisibility);

  Map<String, dynamic> getVariables() =>
      {'updateListVisibilityInput': listVisibility.toJson()};

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kFollower: listVisibility.follower.name,
        AnalyticsParameters.kFollowing: listVisibility.following.name,
      };
}

class IsEmailVerifiedEvent extends MainBlocEvent {}
