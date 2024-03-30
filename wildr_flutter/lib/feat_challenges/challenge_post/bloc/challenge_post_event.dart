import 'package:wildr_flutter/bloc/main/main_bloc.dart';

enum PinChallengeEnum { PIN, UNPIN }

abstract class ChallengePostEvent extends MainBlocEvent {
  const ChallengePostEvent();

  @override
  Map<String, dynamic>? getAnalyticParameters() => null;

  @override
  bool shouldLogEvent() => false;
}

class PinChallengeEntryEvent extends ChallengePostEvent {
  final String challengeId;
  final String entryId;
  final PinChallengeEnum pinChallengeEnum;

  PinChallengeEntryEvent({
    required this.challengeId,
    required this.entryId,
    required this.pinChallengeEnum,
  });

  Map<String, dynamic> getInput() => {
      'input': {
        'flag': pinChallengeEnum == PinChallengeEnum.PIN ? 'PIN' : 'UNPIN',
        'challengeId': challengeId,
        'entryId': entryId,
      },
    };
}

class GetJoinedChallengesEvent extends ChallengePostEvent {
  final String challengeState;

  GetJoinedChallengesEvent({
    required this.challengeState,
  });

  Map<String, dynamic> getInput() => {
      'input': {'challengeState': challengeState},
    };
}
