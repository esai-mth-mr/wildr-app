import 'package:equatable/equatable.dart';

abstract class ChallengeSearchEvent extends Equatable {
  const ChallengeSearchEvent();

  @override
  List<Object?> get props => [];
}

class ChallengeSearchQueryChangedEvent extends ChallengeSearchEvent {
  final String query;

  const ChallengeSearchQueryChangedEvent({
    required this.query,
  });

  @override
  List<Object?> get props => [query];
}
