import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:overlay_tooltip/overlay_tooltip.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenge_home_state.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_bloc.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/challenges_cards_view.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/intro_overlay_card.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/widgets/custom_drop_down.dart';
import 'package:wildr_flutter/widgets/notification_cta.dart';

class ChallengesHomePage extends StatefulWidget {
  const ChallengesHomePage({super.key});

  @override
  State<ChallengesHomePage> createState() => _ChallengesHomePageState();
}

class _ChallengesHomePageState extends State<ChallengesHomePage> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  void _createChallenge(BuildContext context) {
    Common().mainBloc(context).logCustomEvent(
          ChallengesAnalyticsEvents.kTapCreateChallengeIconButton,
        );
    if (Common().isLoggedIn(context)) {
      context.pushRoute(const CreateChallengePageRoute()).then((submitted) {
        if (submitted == true) {
          context.read<ChallengesMainBloc>().add(GetMyChallengesEvent());
          context.read<ChallengesMainBloc>().add(GetAllChallengesEvent());
          context.read<ChallengesMainBloc>().add(GetFeaturedChallengesEvent());
        }
      });
    } else {
      Common().openLoginPage(context.router);
      Common().showSnackBar(
        context,
        _appLocalizations.challenge_loginSignupPromptChallenge,
        isDisplayingError: true,
        millis: 2000,
      );
    }
  }

  PreferredSizeWidget _appBar(BuildContext context) => AppBar(
        title: Text(_appLocalizations.challenge_cap_challenges),
        centerTitle: true,
        actions: [
          const NotificationCTA(isFromChallenges: true),
          OverlayTooltipItem(
            displayIndex: 2,
            tooltip: (controller) => IntroOverlayCard(
              title: _appLocalizations.challenge_createAChallengeWithBook,
              description: _appLocalizations.challenge_createOwnChallengePrompt,
              arrowOnLeft: false,
              arrowOnTop: true,
            ),
            child: IconButton(
              onPressed: () => _createChallenge(context),
              icon: const WildrIcon(
                WildrIcons.plus_circle_outline,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      );

  @override
  Widget build(BuildContext context) => BlocProvider(
        create: (context) =>
            ChallengesMainBloc(gqlBloc: Common().mainBloc(context).gqlBloc),
        child: Builder(
          builder: (context) => BlocListener<MainBloc, MainState>(
            listener: (context, state) {
              if (state is InitCreateChallengeState) {
                _createChallenge(context);
              }
            },
            child: Scaffold(
              resizeToAvoidBottomInset: false,
              appBar: _appBar(context),
              body: const _ChallengeBody(),
            ),
          ),
        ),
      );
}

class _ChallengeBody extends StatefulWidget {
  const _ChallengeBody();

  @override
  State<_ChallengeBody> createState() => _ChallengeBodyState();
}

class _ChallengeBodyState extends State<_ChallengeBody> {
  late bool isUserLoggedIn;
  bool _shouldShowChallengeEducation = false;
  bool _isBodyVisible = false;
  late final List<String> _filterList = [
    ChallengesListType.ALL_ACTIVE.getName(),
    ChallengesListType.ALL.getName(),
    ChallengesListType.ALL_PAST.getName(),
  ];
  ChallengesListType _allChallengesSelectedFilterType =
      ChallengesListType.ALL_ACTIVE;
  final RefreshController _refreshController = RefreshController();

  MainBloc get _mainBloc => BlocProvider.of<MainBloc>(context);
  late final bool _isUserLoggedIn = _mainBloc.isLoggedIn;
  late final bool _shouldShowMyChallenges = _isUserLoggedIn;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  bool get hasCompletedChallengeEducation =>
      Common().currentUser(context).onboardingStats.challengeEducation;

  @override
  void initState() {
    super.initState();
    isUserLoggedIn = Prefs.getString(PrefKeys.kCurrentUserWithToken) != null;
  }

  bool _isAllChallengesListType(ChallengesListType? type) =>
      type == ChallengesListType.ALL_ACTIVE ||
      type == ChallengesListType.ALL ||
      type == ChallengesListType.ALL_PAST;

  Widget _heading(String title, {ChallengesListType? type}) {
    final SliverToBoxAdapter headingTitle;
    if (_isAllChallengesListType(type)) {
      headingTitle = SliverToBoxAdapter(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: OverlayTooltipItem(
                displayIndex: 1,
                tooltipVerticalPosition: TooltipVerticalPosition.TOP,
                tooltip: (controller) => IntroOverlayCard(
                  title: _appLocalizations.challenge_allChallenges,
                  description:
                      _appLocalizations.challenge_recentChallengesSorting,
                  arrowOnTop: false,
                  arrowOnLeft: true,
                ),
                child: Text(
                  title,
                  style: ChallengesStyles.of(context).headline1TextStyle,
                ),
              ),
            ),
            _allChallengesDropDown(),
          ],
        ),
      );
    } else {
      headingTitle = SliverToBoxAdapter(
        child: OverlayTooltipItem(
          displayIndex: 1,
          tooltipVerticalPosition: TooltipVerticalPosition.TOP,
          tooltip: (controller) => IntroOverlayCard(
            title: _appLocalizations.challenge_allChallenges,
            description: _appLocalizations.challenge_recentChallengesSorting,
            arrowOnTop: false,
            arrowOnLeft: true,
          ),
          child: Text(
            title,
            style: ChallengesStyles.of(context).headline1TextStyle,
          ),
        ),
      );
    }
    return SliverPadding(
      padding: Common().challengeHeadingPadding(),
      sliver: headingTitle,
    );
  }

  Widget _allChallengesDropDown() => SizedBox(
        height: Get.height * 0.05,
        width: Get.width * 0.25,
        child: CustomDropdown(
          items: _filterList,
          selectedItem: _allChallengesSelectedFilterType.getName(),
          onChanged: (value) {
            if (value.toLowerCase() ==
                ChallengesListType.ALL_ACTIVE.getName().toLowerCase()) {
              context.read<ChallengesMainBloc>().add(
                    GetAllChallengesEvent(
                      type: ChallengesListType.ALL_ACTIVE,
                    ),
                  );
              _allChallengesSelectedFilterType = ChallengesListType.ALL_ACTIVE;
            } else if (value.toLowerCase() ==
                ChallengesListType.ALL_PAST.getName().toLowerCase()) {
              context.read<ChallengesMainBloc>().add(
                    GetAllChallengesEvent(
                      type: ChallengesListType.ALL_PAST,
                    ),
                  );
              _allChallengesSelectedFilterType = ChallengesListType.ALL_PAST;
            } else {
              context.read<ChallengesMainBloc>().add(GetAllChallengesEvent());
              _allChallengesSelectedFilterType = ChallengesListType.ALL;
            }
            setState(() {});
          },
        ),
      );

  List<Widget> _myChallengesSection() => [
        _heading(_appLocalizations.challenge_myChallenges),
        const ChallengesCardsView(
          ChallengesListType.MY_CHALLENGES,
          key: ValueKey('MY_CHALLENGES'),
        ),
      ];

  Widget _featuredChallengesSection() => const ChallengesCardsView(
        ChallengesListType.FEATURED,
        key: ValueKey('FEATURED'),
      );

  bool _isPaginatingAllChallenges = false;

  List<Widget> _allChallengesSection() => [
        _heading(
          _appLocalizations.challenge_allChallenges,
          type: _allChallengesSelectedFilterType,
        ),
        ChallengesCardsView(
          _allChallengesSelectedFilterType,
          key: const ValueKey('ALL'),
        ),
        if (_isPaginatingAllChallenges)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 8.0),
              child: Center(child: CircularProgressIndicator()),
            ),
          ),
      ];

  Widget _body() {
    final slivers = [
      if (_shouldShowMyChallenges && hasCompletedChallengeEducation)
        ..._myChallengesSection(),
      _featuredChallengesSection(),
      ..._allChallengesSection(),
    ];
    if (slivers.isEmpty) {
      // Still using a sliver in order to allow the refresh indicator to work.
      slivers.add(
        SliverFillRemaining(
          child: Center(
            child: Text(_appLocalizations.challenge_noChallengesFound),
          ),
        ),
      );
    }
    return CustomScrollView(
      slivers: slivers,
    );
  }

  ///Initial refresh is triggered by the [ChallengesCardsView]
  void _onRefresh(BuildContext context) {
    Common().mainBloc(context).logCustomEvent(
          ChallengesAnalyticsEvents.kRefreshChallengesHome,
        );
    if (isUserLoggedIn) {
      context.read<ChallengesMainBloc>().add(GetMyChallengesEvent());
    }
    context
        .read<ChallengesMainBloc>()
        .add(GetAllChallengesEvent(type: _allChallengesSelectedFilterType));
    context.read<ChallengesMainBloc>().add(GetFeaturedChallengesEvent());
  }

  Future<void> _showChallengeEducation(BuildContext context) async {
    if (hasCompletedChallengeEducation) return;
    await Common().delayInPlace(500);
    OverlayTooltipScaffold.of(context)?.controller
      ?..start()
      ..onDone(
        () {
          Common()
              .mainBloc(context)
              .add(FinishOnboardingEvent(OnboardingType.CHALLENGE_EDUCATION));
          // Trigger a rebuild to show the "My challenges" section when
          // the education flow is finished.
          setState(() {});
        },
      );
  }

  Future<void> _challengesMainBlocListener(
    context,
    PaginateChallengesState state,
  ) async {
    if (state.type == ChallengesListType.FEATURED) {
      if (state.paginationState == PaginationState.DONE_REFRESHING) {
        if (_isBodyVisible) {
          await _showChallengeEducation(context);
        } else {
          _shouldShowChallengeEducation = true;
        }
      }
    }

    if (state.type == ChallengesListType.ALL ||
        state.type == ChallengesListType.ALL_PAST ||
        state.type == ChallengesListType.ALL_ACTIVE) {
      setState(() {
        if (state.paginationState == PaginationState.DONE_REFRESHING) {
          _refreshController.refreshCompleted();
        }
        _isPaginatingAllChallenges = state.isPaginating;
      });
    }
  }

  Widget _smartRefresherBod() => SmartRefresher(
        header: Common().defaultClassicHeader,
        controller: _refreshController,
        onRefresh: () async {
          _onRefresh(context);
        },
        child: _body(),
      );

  Widget _visibilityDetectorBody(context) => VisibilityDetector(
        key: const Key('CHALLENGES_HOME_PAGE_BODY'),
        onVisibilityChanged: (info) {
          if (info.visibleFraction == 1.0) {
            _isBodyVisible = true;
            if (_shouldShowChallengeEducation) {
              _showChallengeEducation(context);
            }
          } else {
            _isBodyVisible = false;
          }
        },
        child: _smartRefresherBod(),
      );

  @override
  Widget build(BuildContext context) => MultiBlocListener(
        listeners: [
          BlocListener<ChallengesMainBloc, PaginateChallengesState>(
            listener: _challengesMainBlocListener,
          ),
        ],
        child: _visibilityDetectorBody(context),
      );

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }
}

void print(dynamic message) {
  debugPrint('[ChallengesHomePage]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengesHomePage]: $message');
}
