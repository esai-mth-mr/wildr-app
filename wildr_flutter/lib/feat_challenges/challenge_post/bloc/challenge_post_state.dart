import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/models/pin_challenge_entry_result_model.dart';

class PinChallengeEntryState extends MainState {
  final String? errorMessage;
  final PinChallengeEntryResult? pinChallengeEntryResult;

  PinChallengeEntryState({
    this.errorMessage,
    this.pinChallengeEntryResult,
  });
}

class GetJoinedChallengesState extends MainState {
  final String? errorMessage;
  final List<Challenge>? joinedChallenges;
  final bool isLoading;

  GetJoinedChallengesState.loading()
      : isLoading = true,
        errorMessage = null,
        joinedChallenges = [];

  GetJoinedChallengesState.fromError(this.errorMessage)
      : isLoading = false,
        joinedChallenges = [];

  GetJoinedChallengesState.fromList(this.joinedChallenges)
      : isLoading = false,
        errorMessage = null;
}
