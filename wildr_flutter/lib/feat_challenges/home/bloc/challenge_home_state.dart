import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/get_challenges_gql_isolate_bloc_ext.dart';

enum ChallengesListType {
  GLOBAL,
  MY_CHALLENGES,
  FEATURED,
  ALL,
  ALL_ACTIVE,
  ALL_PAST
}

extension ChallengesListTypeDisplayName on ChallengesListType {
  String getName() {
    switch (this) {
      case ChallengesListType.ALL:
        return 'All';
      case ChallengesListType.ALL_ACTIVE:
        return 'Active';
      case ChallengesListType.ALL_PAST:
        return 'Past';
      case ChallengesListType.GLOBAL:
        return 'Global';
      case ChallengesListType.MY_CHALLENGES:
        return 'My challenges';
      case ChallengesListType.FEATURED:
        return 'Featured';
    }
  }
}

class PaginateChallengesState extends MainState {
  final String? errorMessage;
  final List<Challenge>? list;
  final PageInfo? pageInfo;
  final PaginationState paginationState;
  final ChallengesListType type;

  bool get canPaginate =>
      isShimmering ||
      ((pageInfo?.hasNextPage ?? false) && !isPaginating && !isRefreshing);

  String? get afterCursor => pageInfo?.endCursor;

  bool get isShimmering => paginationState == PaginationState.SHOW_SHIMMER;

  bool get isPaginating => paginationState == PaginationState.PAGINATING;

  bool get isRefreshing => paginationState == PaginationState.REFRESHING;

  PaginateChallengesState.globalShimmer({this.type = ChallengesListType.GLOBAL})
      : errorMessage = null,
        list = null,
        pageInfo = null,
        paginationState = PaginationState.SHOW_SHIMMER;

  PaginateChallengesState.requestPagination(GetChallengesEvent event)
      : errorMessage = null,
        list = null,
        pageInfo = null,
        type = event.type,
        paginationState = event.shouldTriggerShimmer
            ? PaginationState.SHOW_SHIMMER
            : event.after == null
                ? PaginationState.REFRESHING
                : PaginationState.PAGINATING;

  PaginateChallengesState.fromParseGetChallengesResponse(
    ParseGetChallengesResponse response,
  )   : errorMessage = response.errorMessage,
        list = response.challenges,
        pageInfo = response.pageInfo,
        type = response.type,
        paginationState = response.state;
}

class GetMyChallengesState extends PaginateChallengesState {
  GetMyChallengesState.fromParseGetChallengesResponse(
    super.response,
  ) : super.fromParseGetChallengesResponse();

  GetMyChallengesState.requestPagination(super.event)
      : super.requestPagination();
}

class GetFeaturedChallengesState extends PaginateChallengesState {
  GetFeaturedChallengesState.fromParseGetChallengesResponse(
    super.response,
  ) : super.fromParseGetChallengesResponse();

  GetFeaturedChallengesState.requestPagination(super.event)
      : super.requestPagination();
}

class GetAllChallengesState extends PaginateChallengesState {
  GetAllChallengesState.fromParseGetChallengesResponse(
    super.response,
  ) : super.fromParseGetChallengesResponse();

  GetAllChallengesState.requestPagination(super.event)
      : super.requestPagination();
}
