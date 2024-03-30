import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/home/model/pronoun.dart';
import 'package:wildr_flutter/login_signup/signup/personal_info_setup/ask_for_birthday_page.dart';
import 'package:wildr_flutter/login_signup/signup/personal_info_setup/ask_for_interests_page.dart';
import 'package:wildr_flutter/login_signup/signup/personal_info_setup/ask_for_pronouns_page.dart';
import 'package:wildr_flutter/onboarding/skeleton/onboarding_scaffold.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

/// Unused
class PersonalInfoStepsPage extends StatefulWidget {
  const PersonalInfoStepsPage({super.key});

  @override
  State<PersonalInfoStepsPage> createState() => _PersonalInfoStepsPageState();
}

class _PersonalInfoStepsPageState extends State<PersonalInfoStepsPage> {
  Pronoun? _selectedPronoun;
  DateTime? _selectedBirthday;
  List<ChallengeCategoryType>? _selectedCategories;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  int _currentPage = 0;

  late final PageController _pageController = PageController()
    ..addListener(
      () => setState(() {
        _currentPage = _pageController.page!.toInt();
      }),
    );

  Future<void> _onNextPressed() async {
    await _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );

    if (_pageController.page == 2) {
      await context
          .pushRoute(
        LoginPageRoute(
          isSignup: true,
          pronoun: _selectedPronoun,
          birthday: _selectedBirthday,
          categories: _selectedCategories,
        ),
      )
          .then((loggedIn) async {
        // If the user went through challenges onboarding but then decided to
        // log in to an existing account, handle it accordingly.
        if (loggedIn == true) {
          final String? challengeId =
              Prefs.getString(PrefKeys.kChallengeIdForOnboarding);
          await Prefs.remove(PrefKeys.kChallengeIdForOnboarding);

          Common().mainBloc(context).add(
                FinishOnboardingEvent(OnboardingType.CHALLENGES),
              );

          if (challengeId == null || challengeId.isEmpty) {
            // No challenge id was stored (e.g., the '/invite' link)
            // So just pop to the home page.
            context.router.popUntilRoot();
          } else {
            await context.router.pushAndPopUntil(
              SingleChallengePageRoute(
                challengeId: challengeId,
              ),
              predicate: (route) => route.isFirst,
            );
          }
        }
      });
    }
  }

  void _onBackPressed() {
    if (_pageController.page == 0) {
      context.popRoute();
      return;
    }

    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      AskForPronounsPage(
        onPronounSelected: (pronoun) {
          _selectedPronoun = pronoun;
          _onNextPressed();
        },
      ),
      AskForBirthdayPage(
        onSubmit: (birthday) {
          _selectedBirthday = birthday;
          _onNextPressed();
        },
      ),
      AskForInterestsPage(
        onSubmit: (categories) {
          _selectedCategories = categories;
          _onNextPressed();
        },
      ),
    ]
        .map(
          (e) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: e,
          ),
        )
        .toList();

    return OnboardingScaffold(
      appBarTitle: SmoothPageIndicator(
        controller: _pageController, // PageController
        count: pages.length,
        effect: const ExpandingDotsEffect(
          activeDotColor: WildrColors.accentColor,
          dotHeight: 8,
        ),
      ),
      actions: _currentPage == 0
          ? [
              TextButton(
                onPressed: _onNextPressed,
                child: Text(
                  _appLocalizations.login_signup_cap_skip,
                  style: const TextStyle(
                    color: WildrColors.emerald1000,
                  ),
                ),
              ),
            ]
          : null,
      onBackButtonPressed: _onBackPressed,
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: pages,
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
