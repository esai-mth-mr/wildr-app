part of 'single_challenge_bloc.dart';

abstract class SingleChallengeState extends MainState {
  final String challengeId;

  SingleChallengeState(this.challengeId);
}

abstract class SingleChallengeDataState extends SingleChallengeState {
  final Challenge? challenge;
  final String? errorMessage;

  SingleChallengeDataState(
    super.challengeId,
    this.challenge,
    this.errorMessage,
  );
}

abstract class PaginateChallengeConnectionState
    extends SingleChallengeDataState {
  PaginateChallengeConnectionState(
    super.challengeId,
    super.challenge,
    super.errorMessage,
  );
}

class EmptySingleChallengeDataState extends SingleChallengeState {
  EmptySingleChallengeDataState(super.challengeId);
}

class JoinChallengeState extends SingleChallengeDataState {
  JoinChallengeState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);
}

class LeaveChallengeState extends SingleChallengeDataState {
  LeaveChallengeState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);
}

class ReportChallengeState extends SingleChallengeDataState {
  ReportChallengeState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);
}

class GetSingleChallengeDetailsState extends SingleChallengeDataState {
  GetSingleChallengeDetailsState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);
}

class InitPaginateTodayEntriesState extends SingleChallengeState {
  InitPaginateTodayEntriesState(super.challengeId);
}

class PaginateTodayEntriesState extends PaginateChallengeConnectionState {
  PaginateTodayEntriesState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateTodayEntriesState.fromParsedResult(
    ParsedPaginationResult result,
  ) : super(result.challengeId, result.challenge, result.errorMessage);
}

class InitPaginateFeaturedEntriesState extends SingleChallengeState {
  InitPaginateFeaturedEntriesState(super.challengeId);
}

class PaginateFeaturedEntriesState extends PaginateChallengeConnectionState {
  PaginateFeaturedEntriesState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateFeaturedEntriesState.fromParsedResult(
    ParsedPaginationResult result,
  ) : super(result.challengeId, result.challenge, result.errorMessage);
}

class InitPaginateAllEntriesState extends SingleChallengeState {
  InitPaginateAllEntriesState(super.challengeId);
}

class PaginateAllEntriesState extends PaginateChallengeConnectionState {
  PaginateAllEntriesState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateAllEntriesState.fromParsedResult(
    ParsedPaginationResult result,
  ) : super(result.challengeId, result.challenge, result.errorMessage);
}

class InitPaginateCurrentUserEntriesState extends SingleChallengeState {
  InitPaginateCurrentUserEntriesState(super.challengeId);
}

class PaginateCurrentUserEntriesState extends PaginateChallengeConnectionState {
  PaginateCurrentUserEntriesState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateCurrentUserEntriesState.fromParsedResult(
    ParsedPaginationResult result,
  ) : super(result.challengeId, result.challenge, result.errorMessage);
}

class PaginateUserEntriesState extends PaginateChallengeConnectionState {
  final String userId;

  PaginateUserEntriesState({
    required String challengeId,
    required this.userId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateUserEntriesState.fromParsedResult(
    ParsedPaginationResult result,
    this.userId,
  ) : super(
          result.challengeId,
          result.challenge,
          result.errorMessage,
        );
}

class InitPaginateLeaderboardsState extends SingleChallengeState {
  InitPaginateLeaderboardsState(super.challengeId);
}

class PaginateLeaderboardsState extends PaginateChallengeConnectionState {
  PaginateLeaderboardsState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateLeaderboardsState.fromParsedResult(
    ParsedPaginationResult result,
  ) : super(result.challengeId, result.challenge, result.errorMessage);
}

class PaginateParticipantsState extends PaginateChallengeConnectionState {
  PaginateParticipantsState({
    required String challengeId,
    Challenge? challenge,
    String? errorMessage,
  }) : super(challengeId, challenge, errorMessage);

  PaginateParticipantsState.fromParsedResult(
    ParsedPaginationResult result,
  ) : super(result.challengeId, result.challenge, result.errorMessage);
}

enum PaginationState {
  SHOW_SHIMMER,
  REFRESHING,
  DONE_REFRESHING,
  PAGINATING,
  DONE_PAGINATING,
  ERROR
}
