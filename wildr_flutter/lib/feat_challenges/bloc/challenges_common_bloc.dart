// ignore_for_file: invalid_use_of_visible_for_testing_member

import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';

part 'challenges_common_bloc.freezed.dart';
part 'challenges_common_event.dart';
part 'challenges_common_state.dart';

/// A bloc used for state that is used/shared between multiple pages in
/// challenges.
class ChallengesCommonBloc
    extends Bloc<ChallengesCommonEvent, ChallengesCommonState> {
  final WildrGqlIsolateBlocWrapper gqlBloc;
  StreamSubscription? gqlBlocListener;

  ChallengesCommonBloc({required this.gqlBloc})
      : super(
          const ChallengesCommonState.initial(),
        ) {
    gqlBlocListener = gqlBloc.stream.listen(
      (gqlBlocState) {
        if (gqlBlocState is ChallengesCommonState) {
          gqlBlocState.whenOrNull(
            categoriesSuccess: (categories) => emit(
              ChallengesCommonState.categoriesSuccess(categories),
            ),
            categoriesError: (errorMessage) => emit(
              ChallengesCommonState.categoriesError(errorMessage),
            ),
          );
        }
      },
    );

    on<ChallengesCommonEvent>(
      (event, emit) {
        event.when(
          getCategories: () {
            emit(const ChallengesCommonState.categoriesLoading());
            gqlBloc.add(
              const ChallengesCommonEvent.getCategories(),
            );
          },
        );
      },
    );
  }

  @override
  Future<void> close() {
    gqlBlocListener?.cancel();
    return super.close();
  }
}
