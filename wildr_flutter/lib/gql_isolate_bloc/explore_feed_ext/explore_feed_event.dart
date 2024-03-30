import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';

class GetExploreFeedEvent extends MainBlocEvent {
  final String postType;
  final String scopeType;

  GetExploreFeedEvent({
    FeedScopeType feedScopeType = FeedScopeType.PERSONALIZED,
    FeedPostType feedPostType = FeedPostType.ALL,
  })  : postType = feedPostType.name,
        scopeType = feedScopeType.name,
        super();

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kFeedPostType: postType,
      AnalyticsParameters.kFeedScopeType: scopeType,
    };
}

class UpdateExploreFeedVariablesEvent extends MainBlocEvent {
  final String feedPostTypeStr;
  final String feedScopeTypeStr;
  final int first;

  UpdateExploreFeedVariablesEvent(
    this.feedPostTypeStr, {
    this.first = 8,
  }) : feedScopeTypeStr = FeedScopeType.GLOBAL.name;

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kFeedPostType: feedPostTypeStr,
      AnalyticsParameters.kFeedScopeType: feedScopeTypeStr,
    };
}

class RefetchExploreFeedEvent extends MainBlocEvent {}

class PaginateExploreFeedEvent extends MainBlocEvent {
  final String postType;
  final String scopeType;
  final String endCursor;

  PaginateExploreFeedEvent({
    FeedPostType postType = FeedPostType.ALL,
    FeedScopeType scopeType = FeedScopeType.PERSONALIZED,
    this.endCursor = '',
  })  : postType = postType.name,
        scopeType = scopeType.name;

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kFeedPostType: postType,
      AnalyticsParameters.kFeedScopeType: scopeType,
    };
}

class UpdateExploreFeedLastSeenCursorEvent extends MainBlocEvent {
  final int timestamp;
  final String endCursor;
  final bool? isRefresh;
  final FeedPostType? feedType;
  final FeedScopeType? scopeType;

  UpdateExploreFeedLastSeenCursorEvent({
    required this.endCursor,
    this.isRefresh = false,
    this.feedType,
    this.scopeType,
  }) : timestamp = DateTime.now().millisecondsSinceEpoch;

  Map<String, dynamic> getVariables() => {
      'input': {
        'timestamp': '$timestamp',
        'endCursor': endCursor,
        'isRefresh': isRefresh,
        'feedType': feedType?.name,
        'scopeType': FeedScopeType.PERSONALIZED.name,
      },
    };

  @override
  bool shouldLogEvent() => false;
}
