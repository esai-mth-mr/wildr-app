// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/feat_challenges/bloc/challenges_common_bloc.dart';
import 'package:wildr_flutter/feat_challenges/create/bloc/create_challenge_form_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/models/troll_detection_result_model.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';

extension ChallengesGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> createChallenge(CreateChallengeEvent event) async {
    final variables = await event.getInput();
    log(variables.toString());
    final QueryResult result = await gService.performMutation(
      GQMutations.kCreateChallenge,
      variables: variables,
      operationName: 'createChallenge',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null) {
      emit(
        event.formState.copyWith(
          formStatus: CreateChallengeFormStatus.failure,
          errorMessage: errorMessage,
        ),
      );
      return;
    }
    emit(
      event.formState.copyWith(
        formStatus: CreateChallengeFormStatus.success,
      ),
    );
  }

  Future<void> getOnboardingCategories(ChallengesCommonEvent event) async {
    await event.whenOrNull(
      getCategories: () async {
        const query = r'''
        query getCategoriesWithTypes($input: GetCategoriesWithTypesInput!) {
          getCategoriesWithTypes(input: $input) {
            ... on GetCategoriesWithTypesResult {
              categories {
                name
                categories {
                    id
                    value
                }
              }
            }
          }
        }
        ''';

        final QueryResult result = await gService.performQuery(
          query,
          operationName: 'getCategoriesWithTypes',
          variables: {
            'input': {'shouldAddUserPreferences': false},
          },
          fetchPolicy: FetchPolicy.cacheAndNetwork,
        );

        final String? errorMessage =
            getErrorMessageFromResultAndLogEvent(event, result);

        if (errorMessage != null) {
          emit(ChallengesCommonState.categoriesError(errorMessage));
          return;
        }
        final List<ChallengeCategory> categories =
            (result.data?['getCategoriesWithTypes']?['categories']
                    as List<dynamic>)
                .map((category) => ChallengeCategory.fromJson(category))
                .toList();
        emit(ChallengesCommonState.categoriesSuccess(categories));
      },
    );
  }

  Future<void> checkTrollDetection(CheckTroll event) async {
    QueryResult? nameResult;
    String? nameErrorMessage;
    if (event.nameText != null) {
      nameResult = await gService.performMutation(
        GQMutations.kCheckTroll,
        variables: await event.getNameInput(),
        operationName: 'detectTrolling',
      );
      nameErrorMessage =
          getErrorMessageFromResultAndLogEvent(event, nameResult);
    }

    QueryResult? descResult;
    String? descErrorMessage;
    if (event.descText != null) {
      descResult = await gService.performMutation(
        GQMutations.kCheckTroll,
        variables: await event.getDescInput(),
        operationName: 'detectTrolling',
      );
      descErrorMessage =
          getErrorMessageFromResultAndLogEvent(event, descResult);
    }

    final String? nameTrollResultData =
        TrollDetectionModel.fromJson(nameResult?.data).trollDetectionData?.text;
    final String? descTrollResultData =
        TrollDetectionModel.fromJson(descResult?.data).trollDetectionData?.text;

    debugPrint('nameTrollResultData $nameTrollResultData');
    final CreateChallengeFormStatus formStatus;
    if (nameErrorMessage != null || descErrorMessage != null) {
      formStatus = CreateChallengeFormStatus.failure;
    } else if (nameTrollResultData != null || descTrollResultData != null) {
      if (event.shouldSubmit) {
        formStatus = CreateChallengeFormStatus.trollDetectedWhenSubmitting;
      } else {
        formStatus = CreateChallengeFormStatus.trollDetected;
      }
    } else {
      if (event.shouldSubmit) {
        formStatus = CreateChallengeFormStatus.trollNotDetectedAndShouldSubmit;
      } else {
        formStatus = CreateChallengeFormStatus.trollNotDetected;
      }
    }
    emit(
      event.formState.copyWith(
        formStatus: formStatus,
        errorMessage: nameErrorMessage ?? descErrorMessage,
        trollDetection: CreateChallengeTrollDetection(
          nameErrorMessage: nameErrorMessage,
          descErrorMessage: descErrorMessage,
          nameTrollResult: TrollDetectionModel.fromJson(nameResult?.data)
              .trollDetectionData
              ?.text,
          descriptionTrollResult: TrollDetectionModel.fromJson(descResult?.data)
              .trollDetectionData
              ?.text,
        ),
      ),
    );
  }
}
