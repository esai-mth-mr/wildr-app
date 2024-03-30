import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_and_connections_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';

part 'single_challenge_event.dart';
part 'single_challenge_state.dart';

void print(dynamic message) {
  debugPrint('[SingleChallengeBloc]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [SingleChallengeBloc]: $message');
}

class SingleChallengeBloc
    extends Bloc<SingleChallengeEvent, SingleChallengeState> {
  final WildrGqlIsolateBlocWrapper gqlBloc;
  final String challengeId;
  StreamSubscription? gqlBlocListener;
  late Challenge challenge;
  late final String pageId;

  SingleChallengeBloc({
    required this.gqlBloc,
    required this.challengeId,
  }) : super(EmptySingleChallengeDataState(challengeId)) {
    challenge = Challenge.empty(defaultId: challengeId);
    gqlBlocListener = gqlBloc.stream.listen(
      (state) {
        if (state is! SingleChallengeState) {
          // print('is not SingleChallengeState, ${state.runtimeType}');
          return;
        }
        _handleState(state);
      },
    );
    pageId = '$challengeId#${const Uuid().v4()}';
    on<SingleChallengeEvent>(_eventHandlerForSingleChallengeEvent);
  }

  Future<void> _eventHandlerForSingleChallengeEvent(
    SingleChallengeEvent event,
    emit,
  ) async {
    if (event is SingleChallengeCompleteRefreshEvent) {
      print('SingleChallengeCompleteRefreshEvent...');
      _completeRefreshEvent(emit);
      return;
    }
    if (event is PaginateFeaturedEntriesEvent) {
      if (challenge.featuredEntriesConnection == null) {
        challenge.featuredEntriesConnection =
            ChallengeEntriesConnection.shimmer();
      } else if (event.after == null) {
        challenge.featuredEntriesConnection?.state = PaginationState.REFRESHING;
      } else if (event.after != null) {
        challenge.featuredEntriesConnection?.state = PaginationState.PAGINATING;
      }
      emit(
        PaginateFeaturedEntriesState(
          challengeId: challengeId,
          challenge: challenge,
        ),
      );
    } else if (event is PaginateTodayEntriesEvent) {
      if (challenge.todayEntriesConnection == null) {
        challenge.todayEntriesConnection ??=
            ChallengeEntriesConnection.shimmer();
      } else if (event.after == null) {
        challenge.todayEntriesConnection?.state = PaginationState.REFRESHING;
      } else if (event.after != null) {
        challenge.todayEntriesConnection?.state = PaginationState.PAGINATING;
      }
      emit(
        PaginateTodayEntriesState(
          challengeId: challengeId,
          challenge: challenge,
        ),
      );
    } else if (event is PaginateAllEntriesEvent) {
      if (challenge.allEntriesConnection == null) {
        challenge.allEntriesConnection ??= ChallengeEntriesConnection.shimmer();
      } else if (event.after == null) {
        challenge.allEntriesConnection?.state = PaginationState.REFRESHING;
      } else if (event.after != null) {
        challenge.allEntriesConnection?.state = PaginationState.PAGINATING;
      }
      emit(
        PaginateAllEntriesState(
          challengeId: challengeId,
          challenge: challenge,
        ),
      );
    } else if (event is PaginateCurrentUserEntriesEvent) {
      if (challenge.currentUserEntriesConnection == null) {
        challenge.currentUserEntriesConnection ??=
            ChallengeEntriesConnection.shimmer();
      } else if (event.after == null) {
        challenge.currentUserEntriesConnection?.state =
            PaginationState.REFRESHING;
      } else if (event.after != null) {
        challenge.currentUserEntriesConnection?.state =
            PaginationState.PAGINATING;
      }
      emit(
        PaginateCurrentUserEntriesState(
          challengeId: challengeId,
          challenge: challenge,
        ),
      );
    } else if (event is PaginateUserEntriesEvent) {
      challenge.userEntriesConnectionsMap ??= {};
      if (challenge.userEntriesConnectionsMap?[event.userToSearchForId] ==
          null) {
        challenge.userEntriesConnectionsMap?[event.userToSearchForId ?? ''] ??=
            ChallengeEntriesConnection.shimmer();
      } else if (event.after == null) {
        challenge.userEntriesConnectionsMap?[event.userToSearchForId ?? '']
            ?.state = PaginationState.REFRESHING;
      } else if (event.after != null) {
        challenge.userEntriesConnectionsMap?[event.userToSearchForId ?? '']
            ?.state = PaginationState.PAGINATING;
      }
      emit(
        PaginateUserEntriesState(
          userId: event.userToSearchForId ?? '',
          challengeId: challengeId,
          challenge: challenge,
        ),
      );
    } else if (event is PaginateLeaderboardsEvent) {
      if (challenge.leaderboardConnection == null) {
        challenge.leaderboardConnection ??=
            ChallengeLeaderboardConnection.shimmer();
      } else if (event.after == null) {
        challenge.leaderboardConnection?.state = PaginationState.REFRESHING;
      } else if (event.after != null) {
        challenge.leaderboardConnection?.state = PaginationState.PAGINATING;
      }
      emit(
        PaginateLeaderboardsState(
          challengeId: challengeId,
          challenge: challenge,
        ),
      );
    } else if (event is InitPaginateFeaturedEntriesEvent) {
      emit(InitPaginateFeaturedEntriesState(challengeId));
      return;
    } else if (event is OnNewPostCreatedEvent) {
      if (event.challengeId == challengeId) {
        add(GetSingleChallengeDetailsEvent(challengeId));
        emit(InitPaginateTodayEntriesState(challengeId));
        emit(InitPaginateFeaturedEntriesState(challengeId));
        emit(InitPaginateAllEntriesState(challengeId));
        final String after =
            challenge.currentUserEntriesConnection?.afterCursor ??
                ((challenge.currentUserEntriesConnection?.entries ??
                        [ChallengeEntry.shimmer()])
                    .last
                    .cursor);
        if (after.isEmpty) {
          print('Init pagination');
          emit(InitPaginateCurrentUserEntriesState(challengeId));
        } else {
          print('PaginateCurrentUserEntriesEvent after $after');
          add(
            PaginateCurrentUserEntriesEvent(
              challengeId,
              after: after,
            ),
          );
        }
        emit(InitPaginateLeaderboardsState(challengeId));
      }
      return;
    }
    await _sendGqlEvent(event);
  }

  //region State Handler
  void _handleTodayEntriesState(PaginateTodayEntriesState state) {
    if (state.challenge != null) {
      challenge.todayEntriesConnection =
          state.challenge?.todayEntriesConnection;
    } else if (state.errorMessage != null) {
      challenge.todayEntriesConnection ??=
          ChallengeEntriesConnection.fromError(state.errorMessage);
    }
  }

  void _handleFeaturedEntriesState(PaginateFeaturedEntriesState state) {
    if (state.challenge != null) {
      challenge.featuredEntriesConnection =
          state.challenge?.featuredEntriesConnection;
    } else if (state.errorMessage != null) {
      challenge.featuredEntriesConnection =
          ChallengeEntriesConnection.fromError(state.errorMessage);
    }
  }

  void _handleAllEntriesState(PaginateAllEntriesState state) {
    if (state.challenge != null) {
      challenge.allEntriesConnection = state.challenge?.allEntriesConnection;
    } else if (state.errorMessage != null) {
      challenge.allEntriesConnection =
          ChallengeEntriesConnection.fromError(state.errorMessage);
    }
  }

  void _handleCurrentUserEntriesState(PaginateCurrentUserEntriesState state) {
    if (state.challenge != null) {
      challenge
        ..currentUserEntriesConnection =
            state.challenge?.currentUserEntriesConnection
        ..currentUserProgressCount = state.challenge?.currentUserProgressCount;
    } else if (state.errorMessage != null) {
      challenge.currentUserEntriesConnection =
          ChallengeEntriesConnection.fromError(state.errorMessage);
    }
  }

  void _handleUserEntriesState(PaginateUserEntriesState state) {
    if (state.errorMessage != null) {
      challenge.userEntriesConnectionsMap?[state.userId] =
          ChallengeEntriesConnection.fromError(state.errorMessage);
    } else if (state.challenge != null &&
        challenge.userEntriesConnectionsMap?[state.userId] != null &&
        state.challenge?.userEntriesConnectionsMap?[state.userId] != null) {
      challenge.userEntriesConnectionsMap![state.userId] =
          state.challenge!.userEntriesConnectionsMap![state.userId]!;
    }
  }

  void _handleLeaderboardState(PaginateLeaderboardsState state) {
    final leaderboardConnection = state.challenge?.leaderboardConnection;
    if (leaderboardConnection != null) {
      if (leaderboardConnection.state == PaginationState.DONE_PAGINATING) {
        challenge.leaderboardConnection?.state = leaderboardConnection.state;
        challenge.leaderboardConnection?.participants
            .addAll(leaderboardConnection.participants);
        challenge.leaderboardConnection?.pageInfo ??=
            leaderboardConnection.pageInfo;
        if (leaderboardConnection.pageInfo != null) {
          challenge.leaderboardConnection?.pageInfo
              ?.copyFromPagination(leaderboardConnection.pageInfo!);
        }
      } else {
        challenge.leaderboardConnection = leaderboardConnection;
      }
    } else if (state.errorMessage != null) {
      challenge.leaderboardConnection =
          ChallengeLeaderboardConnection.fromError(state.errorMessage);
    } else {
      challenge.leaderboardConnection =
          ChallengeLeaderboardConnection.fromError(kSomethingWentWrong);
    }
  }

  void _handleParticipantsState(PaginateParticipantsState state) {
    //check for pagination and append items when needed
    final participantsConnection = state.challenge?.participantsConnection;
    if (participantsConnection != null) {
      if (participantsConnection.state == PaginationState.DONE_PAGINATING) {
        challenge.participantsConnection?.state = participantsConnection.state;
        //Append values
        challenge.participantsConnection?.participants
            .addAll(participantsConnection.participants);
        challenge.participantsConnection?.pageInfo ??=
            participantsConnection.pageInfo;
        if (participantsConnection.pageInfo != null) {
          challenge.participantsConnection?.pageInfo
              ?.copyFromPagination(participantsConnection.pageInfo!);
        }
      } else {
        challenge.participantsConnection = participantsConnection;
      }
    } else if (state.errorMessage != null) {
      challenge.participantsConnection =
          ChallengeParticipantsConnection.fromError(state.errorMessage);
    } else {
      challenge.participantsConnection =
          ChallengeParticipantsConnection.fromError(kSomethingWentWrong);
    }
  }

  void _handleState(SingleChallengeState state) {
    if (state.challengeId != challengeId) {
      return;
    }
    if (state is GetSingleChallengeDetailsState) {
      if (state.challenge != null) {
        challenge
          ..fromSingleChallengeDetails(state.challenge!)
          ..isLoading = false;
      } else if (state.errorMessage != null) {
        challenge.isLoading = false;
      }
    } else if (state is PaginateTodayEntriesState) {
      _handleTodayEntriesState(state);
    } else if (state is PaginateFeaturedEntriesState) {
      _handleFeaturedEntriesState(state);
    } else if (state is PaginateAllEntriesState) {
      _handleAllEntriesState(state);
    } else if (state is PaginateCurrentUserEntriesState) {
      _handleCurrentUserEntriesState(state);
    } else if (state is PaginateUserEntriesState) {
      _handleUserEntriesState(state);
    } else if (state is PaginateLeaderboardsState) {
      _handleLeaderboardState(state);
    } else if (state is PaginateParticipantsState) {
      _handleParticipantsState(state);
    } else if (state is JoinChallengeState) {
      challenge.currentUserContext = state.challenge?.currentUserContext;
      add(GetSingleChallengeDetailsEvent(challengeId));
    } else if (state is LeaveChallengeState) {
      challenge.currentUserContext = state.challenge?.currentUserContext;
      add(GetSingleChallengeDetailsEvent(challengeId));
    }
    // ignore: invalid_use_of_visible_for_testing_member
    emit(state);
  }

  //endregion

  void _completeRefreshEvent(emit) {
    add(GetSingleChallengeDetailsEvent(challengeId));
    emit(InitPaginateTodayEntriesState(challengeId));
    emit(InitPaginateFeaturedEntriesState(challengeId));
    emit(InitPaginateAllEntriesState(challengeId));
    emit(InitPaginateCurrentUserEntriesState(challengeId));
    emit(InitPaginateLeaderboardsState(challengeId));
  }

  Future<void> _sendGqlEvent(SingleChallengeEvent event) async {
    await gqlBloc.add(event);
  }

  @override
  Future<void> close() {
    gqlBlocListener?.cancel();
    return super.close();
  }
}
