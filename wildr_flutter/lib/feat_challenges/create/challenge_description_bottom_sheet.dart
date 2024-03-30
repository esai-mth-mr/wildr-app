import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/feat_challenges/create/bloc/create_challenge_form_bloc.dart';
import 'package:wildr_flutter/feat_challenges/create/widgets/create_challenge_bottom_sheet.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_text_field.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

const _maxLength = 500;

class ChallengeDescriptionBottomSheet extends StatefulWidget {
  final CreateChallengeFormBloc createChallengeFormBloc;
  final String? initialDescription;
  final Function(String data, String text) onDescriptionSaved;

  const ChallengeDescriptionBottomSheet({
    super.key,
    required this.createChallengeFormBloc,
    this.initialDescription,
    required this.onDescriptionSaved,
  });

  @override
  State<ChallengeDescriptionBottomSheet> createState() =>
      _ChallengeDescriptionBottomSheetState();
}

class _ChallengeDescriptionBottomSheetState
    extends State<ChallengeDescriptionBottomSheet> {
  late final _descriptionTextController = MentionsInputController()
    ..text = widget.initialDescription ?? '';
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    // SystemChannels.textInput.invokeMethod('TextInput.show');
    super.initState();
  }

  Widget get _counter => SizedBox(
        height: 12.0.w,
        width: 12.0.w,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          value: (_descriptionTextController.text.length) / _maxLength,
          backgroundColor: WildrColors.bannerOrTileBgColor(context),
          color: WildrColors.emerald700,
        ),
      );

  Widget get _descriptionHeader => Text.rich(
        TextSpan(
          text: _appLocalizations.comm_cap_description,
          style: ChallengesStyles.of(context).textFieldHeaderTextStyle,
          children: [
            TextSpan(
              text: _appLocalizations.challenge_optional,
              style: ChallengesStyles.of(context).hintTextStyle,
            ),
          ],
        ),
      );

  Widget get _header => Row(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [_descriptionHeader, const Spacer(), _counter],
      );

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: FocusManager.instance.primaryFocus?.unfocus,
        child: CreateChallengeBottomSheet(
          title: _appLocalizations.challenge_descriptionPrompt,
          subtitle: _appLocalizations.challenge_instructionClarityParticipants,
          heightFactor: 0.9,
          onSave: () {
            widget.onDescriptionSaved(
              _descriptionTextController.data,
              _descriptionTextController.text,
            );
          },
          hasEdited: (widget.initialDescription ?? '') !=
              _descriptionTextController.text,
          child: ChallengesTextField(
            controller: _descriptionTextController,
            header: _header,
            hintText: _appLocalizations.challenge_topicPrompt,
            large: true,
            maxLength: _maxLength,
            onChanged: (_) {
              setState(() {});
            },
            focusable: true,
            expands: true,
          ),
        ),
      );

  @override
  void dispose() {
    _descriptionTextController.dispose();
    super.dispose();
  }
}
