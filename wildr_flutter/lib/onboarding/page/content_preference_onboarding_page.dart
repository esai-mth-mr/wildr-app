import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:lottie/lottie.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_state.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_getx_controller.dart';
import 'package:wildr_flutter/onboarding/widgets/category_interests_picker.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ContentPreferenceOnboardingPage extends StatefulWidget {
  final bool shouldShowSkip;

  const ContentPreferenceOnboardingPage({
    super.key,
    this.shouldShowSkip = false,
  });

  @override
  State<ContentPreferenceOnboardingPage> createState() =>
      _ContentPreferenceOnboardingPageState();
}

class _ContentPreferenceOnboardingPageState
    extends State<ContentPreferenceOnboardingPage> {
  List<ChallengeCategory> categories = [];
  bool _isLoading = true;
  late final OnboardingGetXController onboardingGetXController;

  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
    onboardingGetXController = Get.put(OnboardingGetXController());
    Common().mainBloc(context).add(ContentPrefOnboardingGetPostTypesEvent());
    Common().mainBloc(context).add(ContentPrefOnboardingGetCategoriesEvent());
  }

  List<ChallengeCategoryType> getSelectedCategories() =>
      onboardingGetXController.postCategoryPreferences;

  void _showDonePage() {
    Prefs.setBool(PrefKeys.kHasAlreadyShownCategoriesDialog, value: true);
    _isLoading = false;
    context.replaceRoute(
      ContentPreferenceFinishPageRoute(passFail: PassFailState.PASS),
    );
  }

  Widget _skeleton() => WillPopScope(
        onWillPop: () async => false,
        child: Scaffold(
          appBar: AppBar(
            leading: widget.shouldShowSkip
                ? const SizedBox()
                : IconButton(
                    icon: Icon(
                      Platform.isIOS ? Icons.arrow_back_ios : Icons.arrow_back,
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                    },
                  ),
            actions: [
              if (widget.shouldShowSkip)
                TextButton(
                  onPressed: _showDonePage,
                  child: Text(
                    _appLocalizations.login_signup_cap_skip,
                    style: const TextStyle(color: WildrColors.gray500),
                  ),
                ),
            ],
          ),
          body: SafeArea(
            child: Column(
              children: [
                Text(
                  _appLocalizations.onboarding_passionsQuestionPrompt,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 27.0.sp,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _appLocalizations
                      .onboarding_chooseInterestsForRecommendationsPrompt,
                  style:
                      TextStyle(color: WildrColors.gray700, fontSize: 13.0.sp),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                if (_isLoading)
                  Expanded(child: Center(child: _loader()))
                else ...[
                  Expanded(
                    child: CategoryInterestsPicker(
                      categories: categories,
                      previousUserCategories: getSelectedCategories(),
                      onSelectionChanged: () {
                        setState(() {});
                      },
                    ),
                  ),
                  const SizedBox(height: 20),
                  _continueButton(),
                ],
              ],
            ),
          ),
        ),
      );

  Widget _continueButton() => Padding(
        padding: const EdgeInsets.all(8.0),
        child: PrimaryCta(
          text: _appLocalizations.login_signup_cap_continue,
          onPressed: _onContinueTapped,
          filled: true,
        ),
      );

  void _onContinueTapped() {
    context.loaderOverlay.show();
    Common()
        .mainBloc(context)
        .add(UpdateUserCategoryInterestsEvent(getSelectedCategories()));
    Common().mainBloc(context).add(UpdateUserPostTypeInterestsEvent([]));
  }

  Widget _loader() =>
      Center(child: Lottie.asset('assets/animations/loader.json', height: 250));

  Future<void> _blocListener(_, MainState state) async {
    if (state is ContentPrefOnboardingGetPostTypesState) {
      if (state.errorMessage != null) {
        Navigator.of(context).pop();
        await Common().showErrorDialog(
          context,
          title: _appLocalizations.onboarding_failedToFetchPostTypesMessage,
          description: _appLocalizations.onboarding_tryAgainLaterMessage,
        );
      }
    } else if (state is ContentPrefOnboardingGetCategoriesState) {
      if (state.errorMessage != null) {
        Navigator.of(context).pop();
        await Common().showErrorDialog(
          context,
          title: _appLocalizations.onboarding_failedToFetchCategoriesMessage,
          description: _appLocalizations.onboarding_tryAgainLaterMessage,
        );
      }
      setState(() {
        categories = state.categories;
        if (categories.isNotEmpty) {
          _isLoading = false;
        }
      });
    } else if (state is UpdateUserCategoriesInterestsState) {
      context.loaderOverlay.hide();
      if (state.errorMessage != null) {
        setState(() {});
        Common().showErrorSnackBar(state.errorMessage!, context);
      } else {
        onboardingGetXController.postCategoryPreferencesUpdated = true;
        _showDonePage();
      }
    } else if (state is UpdateUserPostTypeInterestsState) {
      context.loaderOverlay.hide();
      if (state.errorMessage != null) {
        setState(() {});
        Common().showErrorSnackBar(state.errorMessage!, context);
      } else {
        onboardingGetXController.postTypePreferencesUpdated = true;
        if (!onboardingGetXController.skipped) {
          _showDonePage();
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: _blocListener,
        child: _skeleton(),
      );
}
