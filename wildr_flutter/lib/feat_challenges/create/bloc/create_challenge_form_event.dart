part of 'create_challenge_form_bloc.dart';

abstract class CreateChallengeFormEvent extends MainBlocEvent {
  const CreateChallengeFormEvent();
}

class UpdateCoverPhoto extends CreateChallengeFormEvent {
  final String? coverPhotoPath;
  final ChallengeCoverPresetEnum? coverPhotoPreset;

  const UpdateCoverPhoto({
    this.coverPhotoPath,
    this.coverPhotoPreset,
  });
}

class UpdateName extends CreateChallengeFormEvent {
  final String name;

  const UpdateName(this.name);
}

class UpdateCategories extends CreateChallengeFormEvent {
  final List<ChallengeCategoryType> categories;

  const UpdateCategories(this.categories);
}

class UpdateDuration extends CreateChallengeFormEvent {
  final DateTime startDate;
  final DateTime endDate;

  const UpdateDuration({
    required this.startDate,
    required this.endDate,
  });
}

class UpdateDescription extends CreateChallengeFormEvent {
  final String data;
  final String text;

  const UpdateDescription({
    required this.data,
    required this.text,
  });
}

class CheckTroll extends CreateChallengeFormEvent {
  final String? nameText;
  final String? descText;

  /// Whether we should try to submit the challenge right after performing troll
  /// detection.
  final bool shouldSubmit;
  final CreateChallengeFormState formState;

  const CheckTroll({
    this.nameText,
    this.descText,
    this.shouldSubmit = false,
    required this.formState,
  });

  Future<Map<String, dynamic>> getNameInput() async => {
        'input': {'content': nameText},
      };

  Future<Map<String, dynamic>> getDescInput() async => {
        'input': {'content': descText},
      };
}

class CreateChallengeEvent extends CreateChallengeFormEvent {
  /// Troll detection data that will be passed if we are overriding.
  final CreateChallengeTrollDetection? trollDetectionData;
  final CreateChallengeFormState formState;

  const CreateChallengeEvent({
    this.trollDetectionData,
    required this.formState,
  });

  Future<Map<String, dynamic>> getInput() async {
    final now = DateTime.now();
    final Map<String, dynamic> createChallengeVariables = {
      'input': {
        'name': formState.name,
        'categoryIds':
            formState.categories.map((category) => category.id).toList(),
        'startDate': formState.startDate!.day == now.day
            ? now.toUtc().toString()
            : formState.startDate!.toUtc().toString(),
        'endDate': formState.endDate!.day == now.day
            // If the end date is the same as today,
            // set it as the end of the day.
            ? DateTime(now.year, now.month, now.day, 23, 59, 59)
                .toUtc()
                .toString()
            : formState.endDate!.toUtc().toString(),
      },
    };
    if (trollDetectionData != null) {
      createChallengeVariables['input']['trollDetectionOverride'] = {
        'name': {
          'message': trollDetectionData?.nameErrorMessage,
          'result': trollDetectionData?.nameTrollResult,
        },
        'description': {
          'message': trollDetectionData?.descErrorMessage,
          'result': trollDetectionData?.descriptionTrollResult,
        },
      };
    }
    if (formState.descriptionData != null &&
        formState.descriptionText != null) {
      createChallengeVariables['input']['description'] =
          SmartTextCommon().createContentForSubmission(
        formState.descriptionData!,
        body: formState.descriptionText,
        shouldAddContentKey: false,
      );
    }
    if (formState.coverPhotoPreset != null) {
      createChallengeVariables['input']['coverEnum'] =
          formState.coverPhotoPreset!.name.toString();
    } else if (formState.coverPhotoPath != null) {
      final thumbnailBytes =
          File(formState.coverPhotoThumbPath!).readAsBytesSync();
      final compressedImageBytes =
          File(formState.coverPhotoPath!).readAsBytesSync();
      final http.MultipartFile thumbnailMultipartFile =
          http.MultipartFile.fromBytes(
        'thumbnail',
        thumbnailBytes,
        filename: '${DateTime.now().second}.webp',
        contentType: http_parser.MediaType('image', 'webp'),
      );
      final http.MultipartFile compressImageMultipartFile =
          http.MultipartFile.fromBytes(
        'image',
        compressedImageBytes,
        filename: '${DateTime.now().second}.webp',
        contentType: http_parser.MediaType('image', 'webp'),
      );
      createChallengeVariables['input']['coverImage'] = {
        'thumbnail': thumbnailMultipartFile,
        'image': compressImageMultipartFile,
      };
    }
    return createChallengeVariables;
  }
}
