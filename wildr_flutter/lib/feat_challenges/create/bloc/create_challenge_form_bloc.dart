// ignore_for_file: invalid_use_of_visible_for_testing_member

import 'dart:async';
import 'dart:io';

import 'package:bloc/bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';

part 'create_challenge_form_bloc.freezed.dart';
part 'create_challenge_form_event.dart';
part 'create_challenge_form_state.dart';

class CreateChallengeFormBloc
    extends Bloc<CreateChallengeFormEvent, CreateChallengeFormState> {
  final WildrGqlIsolateBlocWrapper gqlBloc;

  StreamSubscription? gqlBlocListener;

  CreateChallengeFormBloc({required this.gqlBloc})
      : super(CreateChallengeFormState.initial()) {
    gqlBlocListener = gqlBloc.stream.listen(
      (state) {
        if (state is CreateChallengeFormState) {
          emit(state);
        }
      },
    );

    on<UpdateCoverPhoto>((event, emit) {
      emit(
        state.copyWith(
          coverPhotoPath: event.coverPhotoPath,
          coverPhotoPreset: event.coverPhotoPreset,
        ),
      );
    });
    on<UpdateName>((event, emit) {
      emit(
        state.copyWith(
          name: event.name,
          formStatus: CreateChallengeFormStatus.updatingName,
        ),
      );
    });
    on<UpdateCategories>((event, emit) {
      emit(state.copyWith(categories: event.categories));
    });
    on<UpdateDuration>((event, emit) {
      emit(state.copyWith(startDate: event.startDate, endDate: event.endDate));
    });
    on<UpdateDescription>((event, emit) {
      emit(
        state.copyWith(
          descriptionData: event.data,
          descriptionText: event.text,
          formStatus: CreateChallengeFormStatus.updatingDesc,
        ),
      );
    });
    on<CheckTroll>((event, emit) async {
      if (event.shouldSubmit) {
        emit(state.copyWith(formStatus: CreateChallengeFormStatus.submitting));
      } else {
        emit(
          state.copyWith(
            formStatus: CreateChallengeFormStatus.trollDetecting,
          ),
        );
      }
      await gqlBloc.add(event);
    });

    on<CreateChallengeEvent>((event, emit) async {
      emit(state.copyWith(formStatus: CreateChallengeFormStatus.submitting));
      if (event.formState.coverPhotoPath != null) {
        final images = await Common().generateThumbnailAndCompressImageToFiles(
          event.formState.coverPhotoPath!,
        );
        final eventFormState = event.formState;
        final formState = eventFormState.copyWith(
          coverPhotoPath: images[1].path,
          coverPhotoThumbPath: images[0].path,
        );
        await gqlBloc.add(
          CreateChallengeEvent(
            formState: formState,
            trollDetectionData: event.trollDetectionData,
          ),
        );
        return;
      }
      await gqlBloc.add(event);
    });
  }

  @override
  Future<void> close() {
    gqlBlocListener?.cancel();
    return super.close();
  }
}
