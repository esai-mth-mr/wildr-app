import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_text_field.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class AskForBirthdayPage extends StatefulWidget {
  final void Function(DateTime birthday) onSubmit;

  const AskForBirthdayPage({
    super.key,
    required this.onSubmit,
  });

  @override
  State<AskForBirthdayPage> createState() => _AskForBirthdayPageState();
}

class _AskForBirthdayPageState extends State<AskForBirthdayPage>
    with AutomaticKeepAliveClientMixin {
  DateTime? _selectedBirthday;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  void _showDialog() {
    showCupertinoModalPopup(
      context: context,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height / 3,
        decoration: BoxDecoration(
          color: ChallengesStyles.of(context).backgroundColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(12),
            topRight: Radius.circular(12),
          ),
        ),
        child: Column(
          children: [
            Expanded(
              child: CupertinoDatePicker(
                initialDateTime: _selectedBirthday,
                maximumDate: DateTime.now().add(const Duration(seconds: 1)),
                mode: CupertinoDatePickerMode.date,
                onDateTimeChanged: (newDate) => setState(
                  () => _selectedBirthday = newDate,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: PrimaryCta(
                text: _appLocalizations.comm_cap_done,
                fillWidth: true,
                filled: true,
                onPressed: Navigator.of(context).pop,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return OnboardingBodyWithOptionalTitleAndSubtitle(
      titleText: _appLocalizations.login_signup_birthdayQuestionPrompt,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 64),
            child: ChallengesTextField(
              onTap: _showDialog,
              headerText: _appLocalizations.login_signup_cap_birthdate,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Text(
                  _selectedBirthday == null
                      ? 'MM / DD / YYYY'
                      : DateFormat('MM / dd / yyyy').format(_selectedBirthday!),
                  style: const TextStyle(
                    fontSize: 18,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
          const Spacer(),
          PrimaryCta(
            text: _appLocalizations.login_signup_cap_continue,
            fillWidth: true,
            filled: true,
            onPressed: _selectedBirthday != null
                ? () {
                    widget.onSubmit(_selectedBirthday!);

                    FocusManager.instance.primaryFocus?.unfocus();
                  }
                : null,
          ),
        ],
      ),
    );
  }
}
