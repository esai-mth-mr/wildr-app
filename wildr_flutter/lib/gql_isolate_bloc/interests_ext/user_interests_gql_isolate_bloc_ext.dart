// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_state.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/onboarding/data/post_type.dart';

void print(dynamic message) {
  debugPrint('[UserInterestsGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [UserInterestsGqlIsolateBlocExt]: $message');
}

extension UserInterestsGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> getPostCategories(
    ContentPrefOnboardingGetCategoriesEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.kGetCategoriesWithTypes,
      operationName: 'getCategoriesWithTypes',
      variables: {
        'input': {'shouldAddUserPreferences': true},
      },
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    List<ChallengeCategory> categories = [];
    if (errorMessage == null) {
      categories = (result.data?['getCategoriesWithTypes']?['categories']
              as List<dynamic>)
          .map((category) => ChallengeCategory.fromJson(category))
          .toList();
    }
    emit(
      ContentPrefOnboardingGetCategoriesState(
        errorMessage,
        categories,
        const [],
      ),
    );
  }

  Future<void> getPostTypes(
    ContentPrefOnboardingGetPostTypesEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.kGetPostTypes,
      operationName: 'getPostTypes',
      variables: {'input': ''},
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    final List<PostType> postTypes = [];
    final List<PostType> userPostTypeInterests = [];
    if (errorMessage == null && result.data != null) {
      final List postTypesMaps =
          result.data!['getPostTypes']['postTypes'] as List;
      for (final map in postTypesMaps) {
        postTypes.add(PostType(map['name'], map['value']));
      }
      final userPostTypeInterestMaps =
          result.data!['getPostTypes']['userPostTypeInterests'] as List?;
      if (userPostTypeInterestMaps != null) {
        for (final e in userPostTypeInterestMaps) {
          userPostTypeInterests
              .add(PostType(getPostTypeEnum(int.parse(e)).name, int.parse(e)));
        }
      }
    }
    emit(
      ContentPrefOnboardingGetPostTypesState(
        errorMessage,
        postTypes,
        userPostTypeInterests,
      ),
    );
  }

  Future<void> updateUserCategoryInterests(
    UpdateUserCategoryInterestsEvent event,
  ) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kUpdateCategories,
      operationName: 'updateCategories',
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(UpdateUserCategoriesInterestsState(errorMessage));
  }

  Future<void> updateUserPostTypeInterests(
    UpdateUserPostTypeInterestsEvent event,
  ) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kUpdatePostTypes,
      operationName: 'updatePostTypes',
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    emit(UpdateUserPostTypeInterestsState(errorMessage));
  }
}
