// ignore_for_file: avoid_positional_boolean_parameters

part of 'gql_isolate_bloc.dart';

class GqlIsolateEvent extends MainBlocEvent {}

class Request401LogoutGqlIsolateEvent extends GqlIsolateEvent {
  final bool shouldOpenLoginPage;
  final String operationName;

  Request401LogoutGqlIsolateEvent(
    this.operationName, {
    this.shouldOpenLoginPage = true,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() =>
      {'operationName': operationName};
}

class RefetchHomeFeedGqlIsolateEvent extends MainBlocDoNotLogEvent {
  final FeedScopeType feedScopeType;

  RefetchHomeFeedGqlIsolateEvent({required this.feedScopeType});
}

class RefetchCurrentUserPostsGqlIsolateEvent extends MainBlocEvent {}

class FetchMoreCurrentUserPostsGqlIsolateEvent extends MainBlocEvent {
  final String filter;
  final String endCursor;

  FetchMoreCurrentUserPostsGqlIsolateEvent({
    FeedPostType filterEnum = FeedPostType.ALL,
    this.endCursor = '',
  }) : filter = filterEnum.name;

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kFeedPostType: filter,
      };
}

class ResetGServiceGqlIsolateEvent extends GqlIsolateEvent {
  @override
  bool shouldLogEvent() => false;
}

class ClearFCMTokenToServerGqlIsolateEvent extends GqlIsolateEvent {}

abstract class UpdateFCMTokenEvent extends GqlIsolateEvent {
  final String token;

  UpdateFCMTokenEvent(this.token);
}

class UpdateFcmTokenToServerGqlIsolateEvent extends UpdateFCMTokenEvent {
  UpdateFcmTokenToServerGqlIsolateEvent(super.token);
}

class UpdateFcmTokenAndProceedLogoutEvent extends UpdateFCMTokenEvent {
  UpdateFcmTokenAndProceedLogoutEvent(super.token);
}

class ClearAllFeedSubscriptionsGqlIsolateEvent extends GqlIsolateEvent {
  @override
  bool shouldLogEvent() => false;
}

class CancelSinglePostSubscriptionEvent extends MainBlocEvent {
  final String id;

  CancelSinglePostSubscriptionEvent(this.id);

  @override
  bool shouldLogEvent() => false;
}

class CancelProfilePagePostsSubscriptionEvent extends MainBlocEvent {
  final String id;

  CancelProfilePagePostsSubscriptionEvent(this.id);

  @override
  bool shouldLogEvent() => false;
}

class CancelChallengeConnectionsSubscriptionEvent extends MainBlocEvent {
  final String challengeId;
  final ChallengeConnectionType connectionType;
  final String? userToSearchForId;

  CancelChallengeConnectionsSubscriptionEvent(
    this.challengeId,
    this.connectionType, {
    this.userToSearchForId,
  });

  @override
  bool shouldLogEvent() => false;
}

class CancelChallengeAllConnectionsSubscriptionEvent extends MainBlocEvent {
  final String id;

  CancelChallengeAllConnectionsSubscriptionEvent(this.id);

  @override
  bool shouldLogEvent() => false;
}

class UpdateNetworkEvent extends GqlIsolateEvent {
  final bool isDisconnected;

  UpdateNetworkEvent(this.isDisconnected);

  @override
  bool shouldLogEvent() => false;
}

class CancelHomeFeedSubscriptionsEvent extends SystemEvent {}

class DisableGQLEvents extends SystemEvent {}

class EnableGQLEvents extends SystemEvent {}

class TokenRetrievalTakingLongerEvent extends SystemEvent {}

class LogoutOnTokenRetrievalFailedEvent extends SystemEvent {}
