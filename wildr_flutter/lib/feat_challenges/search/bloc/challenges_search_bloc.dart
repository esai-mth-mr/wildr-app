import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/search/bloc/challenges_search_event.dart';
import 'package:wildr_flutter/feat_challenges/search/bloc/challenges_search_state.dart';

class ChallengeSearchBloc
    extends Bloc<ChallengeSearchEvent, ChallengeSearchState> {
  final List<Challenge> featuredChallenges =
      List.generate(8, (index) => Challenge.empty());

  ChallengeSearchBloc() : super(ChallengeSearchInitial()) {
    on<ChallengeSearchQueryChangedEvent>((event, emit) {
      final matchingItems = featuredChallenges
          .where(
            (item) =>
                item.name.toLowerCase().contains(event.query.toLowerCase()),
          )
          .toList();

      if (event.query.isEmpty) {
        emit(
          ChallengeSearchInitial(),
        );
      } else if (matchingItems.isNotEmpty) {
        emit(
          ChallengeSearchResult(
            searchResult: matchingItems,
          ),
        );
      } else {
        emit(
          NoChallengeFound(),
        );
      }
    });
  }
}
