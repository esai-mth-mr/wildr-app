import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/onboarding/data/post_category.dart';
import 'package:wildr_flutter/onboarding/data/post_type.dart';

class ContentPrefOnboardingGetCategoriesState extends MainState {
  final String? errorMessage;
  final List<ChallengeCategory> categories;
  final List<PostCategory>? userCategoryInterests;

  ContentPrefOnboardingGetCategoriesState(
    this.errorMessage,
    this.categories,
    this.userCategoryInterests,
  );
}

class ContentPrefOnboardingGetPostTypesState extends MainState {
  final String? errorMessage;
  final List<PostType> postTypes;
  final List<PostType>? userPostTypes;

  ContentPrefOnboardingGetPostTypesState(
    this.errorMessage,
    this.postTypes,
    this.userPostTypes,
  );
}

class UpdateUserCategoriesInterestsState extends MainState {
  final String? errorMessage;

  UpdateUserCategoriesInterestsState(this.errorMessage);
}

class UpdateUserPostTypeInterestsState extends MainState {
  final String? errorMessage;

  UpdateUserPostTypeInterestsState(this.errorMessage);
}
