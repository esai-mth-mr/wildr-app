import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenge_home_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/get_all_challenges_queries.dart';

abstract class GetChallengesEvent extends MainBlocEvent {
  final int take;
  final String? after;
  final bool shouldTriggerShimmer;
  final ChallengesListType type;

  GetChallengesEvent(
    this.type,
    this.take,
    this.after, {
    required this.shouldTriggerShimmer,
  });

  String get query;

  Map<String, dynamic> get input;
}

class GetMyChallengesEvent extends GetChallengesEvent {
  GetMyChallengesEvent({
    int take = 10,
    String? after,
    bool shouldTriggerShimmer = false,
  }) : super(
          ChallengesListType.MY_CHALLENGES,
          take,
          after,
          shouldTriggerShimmer: shouldTriggerShimmer,
        );

  @override
  String get query => GetChallengesQueries().myChallengesQuery;

  @override
  Map<String, dynamic> get input => _getInput(take, after, type);
}

class GetFeaturedChallengesEvent extends GetChallengesEvent {
  GetFeaturedChallengesEvent({
    int take = 10,
    String? after,
    bool shouldTriggerShimmer = false,
  }) : super(
          ChallengesListType.FEATURED,
          take,
          after,
          shouldTriggerShimmer: shouldTriggerShimmer,
        );

  @override
  String get query => GetChallengesQueries().featuredChallengesQuery;

  @override
  Map<String, dynamic> get input => _getInput(take, after, type);
}

class GetAllChallengesEvent extends GetChallengesEvent {
  GetAllChallengesEvent({
    ChallengesListType type = ChallengesListType.ALL,
    int take = 20,
    String? after,
    bool shouldTriggerShimmer = false,
  }) : super(type, take, after, shouldTriggerShimmer: shouldTriggerShimmer);

  @override
  String get query => GetChallengesQueries().allChallengesQuery;

  @override
  Map<String, dynamic> get input => _getInput(take, after, type);
}

Map<String, dynamic> _getInput(
  int take,
  String? after,
  ChallengesListType type,
) {
  final Map<String, dynamic> input = {
    'type': type.name,
  };
  final Map<String, dynamic> paginationInput = {'take': take};
  if (after != null) {
    paginationInput['after'] = after;
  }
  input['paginationInput'] = paginationInput;
  return {'input': input};
}
