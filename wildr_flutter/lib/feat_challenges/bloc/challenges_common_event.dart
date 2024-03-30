part of 'challenges_common_bloc.dart';

@freezed
class ChallengesCommonEvent
    with _$ChallengesCommonEvent
    implements MainBlocEvent {
  const ChallengesCommonEvent._();

  const factory ChallengesCommonEvent.getCategories() = _GetCategories;

  @override
  Map<String, dynamic>? getAnalyticParameters() => null;

  @override
  bool shouldLogEvent() => false;
}
