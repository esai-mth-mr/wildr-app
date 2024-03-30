import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/home/model/pronoun.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class AskForPronounsPage extends StatefulWidget {
  final ValueSetter<Pronoun> onPronounSelected;

  const AskForPronounsPage({
    super.key,
    required this.onPronounSelected,
  });

  @override
  State<AskForPronounsPage> createState() => _AskForPronounsPageState();
}

class _AskForPronounsPageState extends State<AskForPronounsPage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  int? _selectedPronounIndex;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return OnboardingBodyWithOptionalTitleAndSubtitle(
      titleText: _appLocalizations.login_signup_pronounsQuestionPrompt,
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: Pronoun.values
            .slice(0, 3)
            .mapIndexed(
              (index, pronoun) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: PrimaryCta(
                  text: pronoun.toViewString(),
                  fillWidth: true,
                  onPressed: () {
                    setState(() {
                      _selectedPronounIndex = index;
                    });

                    widget.onPronounSelected(pronoun);
                  },
                  outline: _selectedPronounIndex != index,
                  filled: _selectedPronounIndex == index,
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}
