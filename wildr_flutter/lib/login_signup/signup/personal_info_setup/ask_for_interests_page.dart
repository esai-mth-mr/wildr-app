import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/feat_challenges/bloc/challenges_common_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/feat_challenges/widgets/categories_list.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_body_with_optional_title_and_subtitle.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';

class AskForInterestsPage extends StatefulWidget {
  final void Function(List<ChallengeCategoryType> interests) onSubmit;

  const AskForInterestsPage({
    super.key,
    required this.onSubmit,
  });

  @override
  State<AskForInterestsPage> createState() => _AskForInterestsPageState();
}

class _AskForInterestsPageState extends State<AskForInterestsPage>
    with AutomaticKeepAliveClientMixin {
  List<ChallengeCategoryType> _selectedCategories = [];
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    context.read<ChallengesCommonBloc>().add(
          const ChallengesCommonEvent.getCategories(),
        );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return OnboardingBodyWithOptionalTitleAndSubtitle(
      titleText: _appLocalizations.login_signup_passionsQuestionPrompt,
      subtitleText: _appLocalizations.login_signup_interestsSelectionPrompt,
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: CategoriesList(
                onCategoriesChanged: (categories) =>
                    _selectedCategories = categories,
              ),
            ),
          ),
          PrimaryCta(
            text: _appLocalizations.login_signup_cap_continue,
            fillWidth: true,
            filled: true,
            onPressed: () => widget.onSubmit(_selectedCategories),
          ),
        ],
      ),
    );
  }
}
