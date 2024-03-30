// ignore_for_file: avoid_positional_boolean_parameters

import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_type.dart';

class GetFeedEvent extends MainBlocEvent {
  final String postTypeFilter;
  final String scopeFilter;

  GetFeedEvent({
    FeedPostType feedPostType = FeedPostType.ALL,
    FeedScopeType scopeType = FeedScopeType.PUBLIC,
  })  : postTypeFilter = feedPostType.name,
        scopeFilter = scopeType.name,
        super();

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kFeedPostType: postTypeFilter,
        AnalyticsParameters.kFeedScopeType: scopeFilter,
      };
}

class FeedUpdateGqlIsolateEvent extends MainBlocEvent {
  final List<Post> posts;
  final String endCursor;
  final String errorMessage;
  final bool isSuccessful;
  final bool isLoading;

  FeedUpdateGqlIsolateEvent({
    this.endCursor = '',
    this.errorMessage = '',
    this.posts = const [],
    this.isSuccessful = true,
    this.isLoading = false,
  });
}

class UpdateHomeFeedVariablesEvent extends MainBlocEvent {
  final FeedPostType feedPostType;
  final FeedScopeType feedScopeType;
  final int first;

  UpdateHomeFeedVariablesEvent(
    this.feedPostType,
    this.feedScopeType, {
    this.first = 8,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kFeedPostType: feedPostType.name,
        AnalyticsParameters.kFeedScopeType: feedScopeType.name,
      };
}

class PaginateHomeFeedEvent extends MainBlocEvent {
  final String filter;
  final String scopeFilter;
  final String endCursor;

  PaginateHomeFeedEvent({
    FeedPostType filterEnum = FeedPostType.ALL,
    FeedScopeType scopeFilterEnum = FeedScopeType.GLOBAL,
    this.endCursor = '',
  })  : filter = filterEnum.name,
        scopeFilter = scopeFilterEnum.name;

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kFeedPostType: filter,
        AnalyticsParameters.kFeedScopeType: scopeFilter,
      };
}

class UpdateSensitiveContentEvent extends MainBlocEvent {
  final PostOverlayType feedOverlay;

  UpdateSensitiveContentEvent(this.feedOverlay);
}

class UpdateHomeFeedLastSeenCursor extends MainBlocEvent {
  final int timestamp;
  final String endCursor;
  final bool? isRefresh;
  final FeedPostType? feedType;
  final FeedScopeType? scopeType;

  UpdateHomeFeedLastSeenCursor({
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
          'scopeType': scopeType?.name,
        },
      };

  @override
  bool shouldLogEvent() => false;
}

class FeedUpdateEvent extends MainBlocEvent {
  final List<Post> posts;
  final String endCursor;
  final ObservableQuery? observableQuery;
  final String errorMessage;
  final bool isSuccessful;
  final bool isLoading;

  FeedUpdateEvent(
    this.observableQuery, {
    this.endCursor = '',
    this.posts = const [],
    this.errorMessage = '',
    this.isSuccessful = true,
    this.isLoading = false,
  }) : super();

  @override
  bool shouldLogEvent() => false;
}

class CanPaginateHomeFeedEvent extends MainBlocEvent {
  final bool canPaginate;

  CanPaginateHomeFeedEvent(this.canPaginate) : super();

  @override
  bool shouldLogEvent() => false;
}
