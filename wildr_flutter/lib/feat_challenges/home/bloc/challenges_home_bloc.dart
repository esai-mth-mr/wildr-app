// ignore_for_file: invalid_use_of_visible_for_testing_member

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenge_home_state.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';

class ChallengesMainBloc extends Bloc<MainBlocEvent, PaginateChallengesState> {
  final WildrGqlIsolateBlocWrapper gqlBloc;

  StreamSubscription? gqlBlocStream;

  ChallengesMainBloc({
    required this.gqlBloc,
  }) : super(PaginateChallengesState.globalShimmer()) {
    gqlBlocStream = gqlBloc.stream.listen(_gqlBlocStreamListener);
    on<MainBlocEvent>((event, emit) async {
      await _onHomeEvent(event, emit);
    });
  }

  void _gqlBlocStreamListener(state) {
    if (state is PaginateChallengesState) {
      emit(state);
    }
  }

  Future<void> _onHomeEvent(MainBlocEvent event, emit) async {
    print('_onHomeEvent ${event.runtimeType}');
    if (event is GetMyChallengesEvent) {
      emit(GetMyChallengesState.requestPagination(event));
    } else if (event is GetFeaturedChallengesEvent) {
      emit(GetFeaturedChallengesState.requestPagination(event));
    } else if (event is GetAllChallengesEvent) {
      emit(GetAllChallengesState.requestPagination(event));
    }
    await _sendGqlEvent(event);
  }

  Future<void> _sendGqlEvent(MainBlocEvent event) async {
    await gqlBloc.add(event);
  }

  @override
  Future<void> close() {
    gqlBlocStream?.cancel();
    return super.close();
  }
}

void print(dynamic message) {
  debugPrint('[ChallengesMainBloc]: $message');
}
