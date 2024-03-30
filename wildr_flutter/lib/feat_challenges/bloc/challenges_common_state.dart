part of 'challenges_common_bloc.dart';

@freezed
class ChallengesCommonState with _$ChallengesCommonState implements MainState {
  const factory ChallengesCommonState.initial() = _Initial;

  const factory ChallengesCommonState.categoriesLoading() = _CategoriesLoading;

  const factory ChallengesCommonState.categoriesError(
    String errorMessage,
  ) = _CategoriesError;

  const factory ChallengesCommonState.categoriesSuccess(
    List<ChallengeCategory> categories,
  ) = _CategoriesSuccess;
}
