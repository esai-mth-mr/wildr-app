part of 'single_challenge_bloc.dart';

//TODO Check whether the getAnalyticParameters() is being called
class SingleChallengeEvent extends MainBlocEvent {
  final String challengeId;

  SingleChallengeEvent(this.challengeId);

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kChallengeId: challengeId,
      };
}

abstract class SingleChallengePaginateEntriesEvent
    extends SingleChallengeEvent {
  final String? after;
  final int take;
  final String? userToSearchForId;

  SingleChallengePaginateEntriesEvent(
    super.challengeId,
    this.after, {
    this.take = 20,
    this.userToSearchForId,
  });

  @override
  Map<String, dynamic>? getAnalyticParameters() {
    final Map<String, dynamic> map = super.getAnalyticParameters() ?? {};
    if (after != null) {
      map['after'] = after;
    }
    if (userToSearchForId != null) {
      map['userToSearchForId'] = userToSearchForId;
    }
    return map;
  }

  ChallengeConnectionType get connectionType;
}

abstract class InitPaginateContentEvent extends SingleChallengeEvent {
  InitPaginateContentEvent(super.challengeId);

  @override
  bool shouldLogEvent() => false;
}

class SingleChallengeCompleteRefreshEvent extends SingleChallengeEvent {
  SingleChallengeCompleteRefreshEvent(super.challengeId);
}

class GetSingleChallengeDetailsEvent extends SingleChallengeEvent {
  GetSingleChallengeDetailsEvent(super.challengeId);
}

//Triggers Paginate State
class InitPaginateTodayEntriesEvent extends InitPaginateContentEvent {
  InitPaginateTodayEntriesEvent(super.challengeId);
}

class PaginateTodayEntriesEvent extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateTodayEntriesEvent(String challengeId, {String? after})
      : super(challengeId, after);

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.todayEntriesConnection;
}

class InitPaginateFeaturedEntriesEvent extends InitPaginateContentEvent {
  InitPaginateFeaturedEntriesEvent(super.challengeId);
}

class PaginateFeaturedEntriesEvent extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateFeaturedEntriesEvent(String challengeId, {String? after})
      : super(challengeId, after);

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.featuredEntriesConnection;
}

class InitPaginateAllEntriesEvent extends InitPaginateContentEvent {
  InitPaginateAllEntriesEvent(super.challengeId);
}

class PaginateAllEntriesEvent extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateAllEntriesEvent(String challengeId, {String? after})
      : super(challengeId, after, take: 30);

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.allEntriesConnection;
}

class InitPaginateCurrentUserEntriesEvent extends InitPaginateContentEvent {
  InitPaginateCurrentUserEntriesEvent(super.challengeId);
}

class PaginateCurrentUserEntriesEvent
    extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateCurrentUserEntriesEvent(String challengeId, {String? after})
      : super(
          challengeId,
          after,
          take: 40,
        );

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.currentUserEntriesConnection;
}

class PaginateUserEntriesEvent extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateUserEntriesEvent(
    String challengeId, {
    required String userId,
    String? after,
  }) : super(
          challengeId,
          after,
          take: 10,
          userToSearchForId: userId,
        );

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.userEntriesConnection;
}

class InitPaginateLeaderboardsEvent extends InitPaginateContentEvent {
  InitPaginateLeaderboardsEvent(super.challengeId);
}

class PaginateLeaderboardsEvent extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateLeaderboardsEvent(String challengeId, {String? after})
      : super(challengeId, after);

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.leaderboardConnection;
}

class PaginateParticipantsEvent extends SingleChallengePaginateEntriesEvent {
  //pagination
  PaginateParticipantsEvent(String challengeId, {String? after})
      : super(challengeId, after);

  @override
  ChallengeConnectionType get connectionType =>
      ChallengeConnectionType.participantsConnection;
}

class JoinChallengeEvent extends SingleChallengeEvent {
  JoinChallengeEvent(super.challengeId);

  Map<String, dynamic> getInput() => {
        'input': {
          'id': challengeId,
        },
      };
}

class LeaveChallengeEvent extends SingleChallengeEvent {
  LeaveChallengeEvent(super.challengeId);

  Map<String, dynamic> getInput() => {
        'input': {
          'id': challengeId,
        },
      };
}

class ReportChallengeEvent extends SingleChallengeEvent {
  final String type;

  ReportChallengeEvent(super.challengeId, ReportTypeEnum type)
      : type = type.name;

  Map<String, dynamic> getInput() => {
        'input': {'challengeId': challengeId, 'type': type},
      };
}

class OnNewPostCreatedEvent extends SingleChallengeEvent {
  OnNewPostCreatedEvent(super.challengeId);

  @override
  bool shouldLogEvent() => false;
}
