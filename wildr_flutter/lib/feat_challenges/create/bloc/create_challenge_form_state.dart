part of 'create_challenge_form_bloc.dart';

enum CreateChallengeFormStatus {
  initial,
  submitting,
  updatingName,
  updatingDesc,
  trollDetecting,
  trollDetected,
  trollDetectedWhenSubmitting,
  trollNotDetected,
  trollNotDetectedAndShouldSubmit,
  success,
  failure
}

@freezed
class CreateChallengeFormState
    with _$CreateChallengeFormState
    implements MainState {

  const factory CreateChallengeFormState({
    String? coverPhotoPath,
    String? coverPhotoThumbPath,
    ChallengeCoverPresetEnum? coverPhotoPreset,
    required String name,
    required List<ChallengeCategoryType> categories,
    DateTime? startDate,
    DateTime? endDate,
    String? descriptionData,
    String? descriptionText,
    required CreateChallengeFormStatus formStatus,
    CreateChallengeTrollDetection? trollDetection,
    String? errorMessage,
  }) = _CreateChallengeFormState;
  const CreateChallengeFormState._();

  factory CreateChallengeFormState.initial() => const CreateChallengeFormState(
        name: '',
        categories: [],
        formStatus: CreateChallengeFormStatus.initial,
      );

  bool get hasEdited =>
      coverPhotoPreset != null ||
      coverPhotoPath != null ||
      name.isNotEmpty ||
      categories.isNotEmpty ||
      startDate != null ||
      endDate != null ||
      descriptionData != null ||
      descriptionText != null;

  bool get canSubmit =>
      (coverPhotoPreset != null || coverPhotoPath != null) &&
      name.isNotEmpty &&
      categories.isNotEmpty &&
      startDate != null &&
      endDate != null &&
      formStatus != CreateChallengeFormStatus.submitting;
}

class CreateChallengeTrollDetection {
  final String? nameTrollResult;
  final String? descriptionTrollResult;
  final String? nameErrorMessage;
  final String? descErrorMessage;
  CreateChallengeTrollDetection({
    this.nameTrollResult,
    this.descriptionTrollResult,
    this.nameErrorMessage,
    this.descErrorMessage,
  });
}
