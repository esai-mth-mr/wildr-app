import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/onboarding/data/post_type.dart';

class ContentPrefOnboardingGetCategoriesEvent extends MainBlocEvent {}

class ContentPrefOnboardingGetPostTypesEvent extends MainBlocEvent {}

class UpdateUserCategoryInterestsEvent extends MainBlocEvent {
  final List<ChallengeCategoryType> list;

  UpdateUserCategoryInterestsEvent(this.list);

  Map<String, dynamic> getVariables() => {
      'input': {'categoryIds': list.map((e) => e.id).toList()},
    };
}

class UpdateUserPostTypeInterestsEvent extends MainBlocEvent {
  final List<PostType> postTypes;

  UpdateUserPostTypeInterestsEvent(this.postTypes);

  Map<String, dynamic> getVariables() => {
      'input': {'postTypes': postTypes.map((e) => '${e.value}').toList()},
    };
}
