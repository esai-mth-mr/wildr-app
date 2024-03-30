// ignore_for_file: lines_longer_than_80_chars

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/create/bloc/create_challenge_form_bloc.dart';
import 'package:wildr_flutter/feat_challenges/create/challenge_category_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/create/challenge_cover_photo_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/create/challenge_description_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/create/challenge_duration_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/category_chip.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/cover_image_or_preset.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_bottom_sheet_confirmation.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_text_field.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_challenges/widgets/troll_detection_bottom_sheet.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class CreateChallengePage extends StatelessWidget {
  const CreateChallengePage({super.key});

  @override
  Widget build(BuildContext context) => BlocProvider(
        create: (context) => CreateChallengeFormBloc(
          gqlBloc: Common().mainBloc(context).gqlBloc,
        ),
        child: const ChallengesTheme(
          // Use a builder widget to get the context of the ChallengesTheme.
          // Required to access the theme when accessing context
          // through the bottom
          // sheet modal.
          child: _CreateChallengeBody(),
        ),
      );
}

class _CreateChallengeBody extends StatefulWidget {
  const _CreateChallengeBody();

  @override
  State<_CreateChallengeBody> createState() => _CreateChallengeBodyState();
}

class _CreateChallengeBodyState extends State<_CreateChallengeBody> {
  CreateChallengeFormBloc get _bloc => context.read<CreateChallengeFormBloc>();

  CreateChallengeFormState get _state => _bloc.state;

  late final _scrollController = ScrollController();

  void _showLeaveConfirmationBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor:
          ChallengesStyles.of(context).bottomSheetActionsBackgroundColor,
      builder: (context) => ChallengesBottomSheetConfirmation(
        title:
            AppLocalizations.of(context)!.challenge_discardChangesQuestionMark,
        description: AppLocalizations.of(context)!.challenge_editWarning,
        confirmText: AppLocalizations.of(context)!.challenge_discardChanges,
        onConfirm: () {
          Navigator.pop(context);
          Navigator.pop(context);
        },
      ),
    );
  }

  void _showCoverPhotoBottomSheet({
    required BuildContext context,
    required CreateChallengeFormBloc createChallengeFormBloc,
  }) {
    showModalBottomSheet(
      isScrollControlled: true,
      context: context,
      builder: (context) => ChallengeCoverPhotoBottomSheet(
        onCoverPhotoSaved: (coverPhotoPath) {
          createChallengeFormBloc.add(
            UpdateCoverPhoto(coverPhotoPath: coverPhotoPath),
          );
        },
        onPresetSaved: (preset) => {
          createChallengeFormBloc.add(
            UpdateCoverPhoto(coverPhotoPreset: preset),
          ),
        },
      ),
    );
  }

  void _showCategoryBottomSheet() {
    FocusManager.instance.primaryFocus?.unfocus();
    showModalBottomSheet(
      isScrollControlled: true,
      context: context,
      builder: (_) => ChallengeCategoryBottomSheet(
        initialSelectedCategories: _state.categories,
        onCategoriesSaved: (categories) {
          _bloc.add(UpdateCategories(categories));
        },
      ),
    );
  }

  void _showDurationBottomSheet() {
    FocusManager.instance.primaryFocus?.unfocus();
    showModalBottomSheet(
      isScrollControlled: true,
      context: context,
      builder: (_) => ChallengeDurationBottomSheet(
        startDate: _state.startDate,
        endDate: _state.endDate,
        onDurationSaved: (date) {
          _bloc.add(
            UpdateDuration(
              startDate: date[0],
              endDate: date[1],
            ),
          );
        },
      ),
    );
  }

  void _showDescriptionBottomSheet() {
    FocusManager.instance.primaryFocus?.unfocus();
    showModalBottomSheet(
      isScrollControlled: true,
      context: context,
      builder: (_) => ChallengeDescriptionBottomSheet(
        createChallengeFormBloc: _bloc,
        initialDescription: _state.descriptionText,
        onDescriptionSaved: (data, text) {
          _bloc.add(
            UpdateDescription(
              data: data,
              text: text,
            ),
          );
        },
      ),
    );
  }

  Widget get _cover => CoverImageOrPreset(
        showEditIcon: true,
        imageFilePath: _state.coverPhotoPath,
        preset: _state.coverPhotoPreset,
        onTap: () => _showCoverPhotoBottomSheet(
          context: context,
          createChallengeFormBloc: _bloc,
        ),
      );

  Widget get _form => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
        child: _Form(
          onCategoryTap: _showCategoryBottomSheet,
          onDurationTap: _showDurationBottomSheet,
          onDescriptionTap: _showDescriptionBottomSheet,
        ),
      );

  Widget get _body => Scaffold(
        appBar: AppBar(
          title: Text(AppLocalizations.of(context)!.challenge_newChallenge),
        ),
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        body: ListView(
          controller: _scrollController,
          children: [
            _cover,
            _form,
          ],
        ),
        bottomNavigationBar: const _CreateChallengeButton(),
      );

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          if (_bloc.state.hasEdited &&
              _bloc.state.formStatus != CreateChallengeFormStatus.success) {
            _showLeaveConfirmationBottomSheet(context);
            return false;
          }
          return true;
        },
        child: BlocBuilder<CreateChallengeFormBloc, CreateChallengeFormState>(
          bloc: _bloc,
          builder: (context, state) {
            if (state.trollDetection?.descriptionTrollResult != null) {
              _scrollController
                  .jumpTo(_scrollController.position.maxScrollExtent);
            }
            return GestureDetector(
              onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
              child: _body,
            );
          },
        ),
      );
}

class _Form extends StatefulWidget {
  final VoidCallback onCategoryTap;
  final VoidCallback onDurationTap;
  final VoidCallback onDescriptionTap;

  const _Form({
    required this.onCategoryTap,
    required this.onDurationTap,
    required this.onDescriptionTap,
  });

  @override
  State<_Form> createState() => _FormState();
}

class _FormState extends State<_Form> {
  static const _nameMaxLength = 75;
  final _durationTextController = TextEditingController();
  final _descriptionTextController = TextEditingController();
  bool isNameTrollDetected = false;
  bool isDescriptionTrollDetected = false;

  CreateChallengeFormBloc get _bloc => context.read<CreateChallengeFormBloc>();

  String numberOfDaysToText(int numberOfDays) {
    if (numberOfDays < 0) {
      return '';
    } else if (numberOfDays == 0) {
      return AppLocalizations.of(context)!.challenge_infinite;
    } else {
      return '${numberOfDays.toStringAsFixed(0)} '
          '${numberOfDays > 1 ? AppLocalizations.of(context)!.challenge_days : AppLocalizations.of(context)!.challenge_day}';
    }
  }

  void _showTrollDetectionBottomSheet(CreateChallengeFormState state) {
    Common().delayIt(
      () {
        if (mounted) {
          showModalBottomSheet(
            context: context,
            builder: (context) => ChallengesBottomSheetTrollDetectionReview(
              onContinueAnyways: () {
                Navigator.pop(context);
                _bloc.add(
                  CreateChallengeEvent(
                    formState: _bloc.state,
                    trollDetectionData: state.trollDetection,
                  ),
                );
              },
            ),
          );
        }
      },
      millisecond: 1000,
    );
  }

  Future<void> _blocListener(
    BuildContext context,
    CreateChallengeFormState state,
  ) async {
    if (state.formStatus ==
        CreateChallengeFormStatus.trollDetectedWhenSubmitting) {
      if (state.trollDetection?.nameTrollResult != null) {
        isNameTrollDetected = true;
      } else if (state.trollDetection?.nameTrollResult == null) {
        isNameTrollDetected = false;
      }
      if (state.trollDetection?.descriptionTrollResult != null) {
        isDescriptionTrollDetected = true;
      }
      if (state.trollDetection?.descriptionTrollResult == null) {
        isDescriptionTrollDetected = false;
      }
      setState(() {});
      context.loaderOverlay.hide();
      _showTrollDetectionBottomSheet(state);
    } else if (state.formStatus ==
        CreateChallengeFormStatus.trollNotDetectedAndShouldSubmit) {
      // await CreateChallengeEvent(formState: _bloc.state).getInput();
      _bloc.add(CreateChallengeEvent(formState: _bloc.state));
    }
  }

  String formatDate(DateTime date) => DateFormat('MM/dd/yyyy').format(date);

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<CreateChallengeFormBloc, CreateChallengeFormState>(
        listener: _blocListener,
        builder: (context, state) {
          _durationTextController.text =
              state.startDate == null && state.endDate == null
                  ? ''
                  : '${formatDate(state.startDate!)} - '
                      '${formatDate(state.endDate!)}';
          _descriptionTextController.text = state.descriptionText ?? '';
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ChallengesTextField(
                headerText: AppLocalizations.of(context)!.challenge_name,
                hintText: AppLocalizations.of(context)!.challenge_hintName,
                error: isNameTrollDetected
                    ? AppLocalizations.of(context)!.challenge_toxicityDetected
                    : null,
                isTrollDetected: isNameTrollDetected,
                focusable: true,
                expands: true,
                maxLength: _nameMaxLength,
                textInputAction: TextInputAction.done,
                onChanged: (text) {
                  context.read<CreateChallengeFormBloc>().add(UpdateName(text));
                  if (text.length == _nameMaxLength) {
                    Common().showGetSnackBar(
                      AppLocalizations.of(context)!
                          .challenge_keepShortAndSweetTextWarning,
                      snackPosition: SnackPosition.TOP,
                    );
                  }
                },
              ),
              ChallengesTextField(
                shouldShowSuffixIcon: true,
                headerText:
                    AppLocalizations.of(context)!.challenge_cap_category,
                hintText:
                    AppLocalizations.of(context)!.challenge_selectCategories,
                onTap: widget.onCategoryTap,
                readOnly: true,
                child: state.categories.isEmpty
                    ? null
                    : Wrap(
                        spacing: 8,
                        children: state.categories
                            .map(
                              (category) => IgnorePointer(
                                child: CategoryChip(
                                  selected: true,
                                  // Must specify a callback to prevent the chip
                                  // using the disabled style.
                            onSelected: (_) {},
                            labelText: category.value,
                          ),
                        ),
                  )
                      .toList(),
                ),
              ),
              ChallengesTextField(
                controller: _durationTextController,
                headerText:
                    AppLocalizations.of(context)!.challenge_cap_duration,
                hintText: AppLocalizations.of(context)!.challenge_selectDates,
                onTap: widget.onDurationTap,
                shouldShowSuffixIcon: true,
                readOnly: true,
              ),
              ChallengesTextField(
                controller: _descriptionTextController,
                error: isDescriptionTrollDetected
                    ? AppLocalizations.of(context)!.challenge_toxicityDetected
                    : null,
                isTrollDetected: isDescriptionTrollDetected,
                expands: true,
                header: Text.rich(
                  TextSpan(
                    text: AppLocalizations.of(context)!.comm_cap_description,
                    style:
                        ChallengesStyles.of(context).textFieldHeaderTextStyle,
                    children: [
                      TextSpan(
                        text: AppLocalizations.of(context)!.challenge_optional,
                        style: ChallengesStyles.of(context).hintTextStyle,
                      ),
                    ],
                  ),
                ),
                hintText: AppLocalizations.of(context)!.challenge_topicPrompt,
                large: true,
                readOnly: true,
                onTap: widget.onDescriptionTap,
              ),
              const SizedBox(height: 8),
              // const VideoMessageCard(),
            ],
          );
        },
      );

  @override
  void dispose() {
    _durationTextController.dispose();
    _descriptionTextController.dispose();
    super.dispose();
  }
}

class _CreateChallengeButton extends StatefulWidget {
  const _CreateChallengeButton();

  @override
  State<_CreateChallengeButton> createState() => _CreateChallengeButtonState();
}

class _CreateChallengeButtonState extends State<_CreateChallengeButton> {
  void _onCreateChallengePressed(
    BuildContext context,
    CreateChallengeFormState state,
  ) {
    final createChallengeFormBloc = context.read<CreateChallengeFormBloc>();
    createChallengeFormBloc.add(
      CheckTroll(
        shouldSubmit: true,
        nameText: state.name,
        descText: state.descriptionText,
        formState: createChallengeFormBloc.state,
      ),
    );
  }

  void _createChallengeFormStateBlocListener(
    BuildContext context,
    CreateChallengeFormState state,
  ) {
    if (state.formStatus == CreateChallengeFormStatus.submitting) {
      context.loaderOverlay.show();
    } else if (state.formStatus == CreateChallengeFormStatus.success) {
      context.loaderOverlay.hide();
      // Pop the route with "true" to indicate that the challenge was created
      // successfully. This will let the previous screen know to refresh the
      // list of challenges.
      context.popRoute(true);
      Common().showSnackBar(
        context,
        AppLocalizations.of(context)!.challenge_created,
      );
    } else if (state.formStatus == CreateChallengeFormStatus.failure) {
      context.loaderOverlay.hide();
      Common().showSnackBar(
        context,
        state.errorMessage ??
            AppLocalizations.of(context)!.challenge_somethingWentWrong,
      );
    }
  }

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).appBarTheme.backgroundColor,
            border: Border(
              top: BorderSide(
                color: ChallengesStyles.of(context).dividerColor,
              ),
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          child:
              BlocConsumer<CreateChallengeFormBloc, CreateChallengeFormState>(
            listener: _createChallengeFormStateBlocListener,
            listenWhen: (previous, current) =>
                previous.formStatus != current.formStatus,
            builder: (context, state) => PrimaryCta(
              onPressed: state.canSubmit
                  ? () => _onCreateChallengePressed(context, state)
                  : null,
              text: state.formStatus == CreateChallengeFormStatus.submitting
                  ? AppLocalizations.of(context)!.challenge_creatingChallenge
                  : AppLocalizations.of(context)!.challenge_createChallenge,
              filled: true,
              fillWidth: true,
            ),
          ),
        ),
      );
}
