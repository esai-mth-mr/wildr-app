import 'package:wildr_flutter/feat_challenges/models/challenge.dart';

abstract class ChallengeSearchState {}

class ChallengeSearchInitial extends ChallengeSearchState {}

class ChallengeSearchResult extends ChallengeSearchState {
  final List<Challenge> searchResult;

  ChallengeSearchResult({required this.searchResult});
  List<Object?> get props => [
        searchResult,
      ];

  ChallengeSearchResult copyWith({
    required  List<Challenge> searchResult,
  }) => ChallengeSearchResult(searchResult: this.searchResult);
}

class NoChallengeFound extends ChallengeSearchState {}
