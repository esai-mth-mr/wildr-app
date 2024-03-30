import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_fgbg/flutter_fgbg.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:overlay_tooltip/overlay_tooltip.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/challenges_tab.dart';
import 'package:wildr_flutter/feat_challenges/home/widgets/challenge_education_overlay_actions.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_current_user.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page.dart';
import 'package:wildr_flutter/feat_upsell_banner/presentation/upsell_banner_widget.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/config_ext/config_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/config_ext/config_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_state_and_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/home/bottom_app_bar_create_post_button.dart';
import 'package:wildr_flutter/home/model/banner.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/login_signup/widgets/email_verification_dialog_box.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('HomePage: $message');
}

enum HomeTab {
  FEED,
  SEARCH,
  CHALLENGES,
  PROFILE,
}

extension HomeTabIndex on HomeTab {
  int get index {
    switch (this) {
      case HomeTab.FEED:
        return 0;
      case HomeTab.SEARCH:
        return 1;
      case HomeTab.CHALLENGES:
        return 2;
      case HomeTab.PROFILE:
        return 3;
    }
  }
}

class HomePage extends StatefulWidget {
  final bool shouldRefreshFeed;
  final HomePageIntent? intent;

  const HomePage({
    super.key,
    this.shouldRefreshFeed = false,
    this.intent,
  });

  @override
  HomePageState createState() => HomePageState();
}

class HomePageState extends State<HomePage>
    with WidgetsBindingObserver, AutomaticKeepAliveClientMixin {
  final _tooltipController = TooltipController();
  int _selectedIndex = HomeTab.FEED.index;
  late final bool isUserLoggedIn;
  double padValue = 0;
  late bool isDarkMode = Get.isDarkMode;
  bool _isFirstTimeSwitchingToProfileTab = true;
  bool _isFirstTimeSwitchingToChallengesTab = true;
  bool _viewOnlyMode = false;
  final PageController _pageController = PageController();
  late HomePageIntent? _intent = widget.intent;
  BannerModel? banner;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  MainBloc get _mainBloc => BlocProvider.of<MainBloc>(context);

  bool _shouldShowBanner(BuildContext context) =>
      _mainBloc.featureFlagsConfig.bannersEnabled &&
      _mainBloc.isLoggedIn &&
      banner != null;

  @override
  void initState() {
    super.initState();
    FirebaseAnalytics.instance.logEvent(name: DebugEvents.kHomePageInit);
    isUserLoggedIn = Prefs.getString(PrefKeys.kCurrentUserWithToken) != null;
    Get.put(FeedGxC(), permanent: true, tag: HOME_FEED_PAGE_ID);
    _checkForForceUpdate();
    WidgetsBinding.instance.addPostFrameCallback(_onPostFrameCallback);
  }

  void _getBanner() {
    if (_mainBloc.featureFlagsConfig.bannersEnabled) {
      _mainBloc.add(GetBannersEvent());
    }
  }

  void _onPostFrameCallback(_) {
    _mainBloc.height = MediaQuery.of(context).size.height -
        MediaQuery.of(context).padding.bottom -
        kBottomNavigationBarHeight;
    _handleIntent();
  }

  Future<void> _handleIntent() async {
    final intent = _intent;
    if (intent == null) return;
    print('Handling intent: ${intent.type.name}');
    await HomePageIntentHandler().handleHomePageIntent(
      intent,
      _mainBloc,
      context.router,
    );
    if (intent.type == HomePageIntentType.SINGLE_CHALLENGE) {
      final challengeTabIndex = HomeTab.CHALLENGES.index;
      _selectedIndex = challengeTabIndex;
      _pageController.jumpToPage(challengeTabIndex);
    }
    setState(() {
      _intent = null;
    });
  }

  void _checkForForceUpdate() {
    final int? lastCheckedTS = Prefs.getInt(PrefKeys.kForceUpdateLastChecked);
    if (lastCheckedTS == null) {
      _mainBloc.add(CheckForceUpdateEvent());
      return;
    }
    final int now = DateTime.now().millisecondsSinceEpoch;
    final diff = (now - lastCheckedTS) / 3600000;
    if (diff > 5) {
      _mainBloc.add(CheckForceUpdateEvent());
      return;
    }
    print('Not checking for force update; diff = $diff');
  }

  Color _getSelectedUnselectedColor(int position) {
    if (_selectedIndex == position) {
      return WildrColors.primaryColor;
    }
    return Theme.of(context).unselectedWidgetColor;
  }

  void _onItemTapped(int index) {
    FocusManager.instance.primaryFocus?.unfocus();
    if (_selectedIndex == index) {
      if (index == 0) {
        _mainBloc.add(ScrollToTheTopOfFeedListEvent());
      } else if (index == 1) {
        _mainBloc.add(ScrollToTheTopOfExploreFeedEvent());
      } else if (index == 2) {
        // TODO: Scroll to the top of the challenge list
      } else if (index == 3) {
        _mainBloc.add(ScrollToTheTopOfCurrentUserPageEvent());
      }
      return;
    }

    if (index == 2) {
      // Avoid the flash of the challenges tab before the route is
      // pushed by adding a small delay.
      Common().delayIt(
        () {
          _pageController.jumpToPage(index);
          setState(() {
            _selectedIndex = index;
            final bool hasCompletedChallengeOnboarding =
                Common().currentUser(context).onboardingStats.challenges;
            if (!hasCompletedChallengeOnboarding &&
                _isFirstTimeSwitchingToChallengesTab) {
              _isFirstTimeSwitchingToChallengesTab = false;
              context.pushRoute(
                ChallengesOnboardingPageRoute(
                  isEntryPoint: false,
                  isChallengeEducation: true,
                  skipLoginFlow: true,
                ),
              );
            }
          });
        },
        millisecond: 500,
      );
    }
    _pageController.jumpToPage(index);
    setState(() {
      _selectedIndex = index;
    });
  }

  Row _bottomAppBarRow() => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            splashRadius: 2,
            padding: EdgeInsets.zero,
            icon: WildrIcon(
              _selectedIndex == 0
                  ? WildrIcons.home_filled
                  : WildrIcons.home_outline,
              color: _getSelectedUnselectedColor(0),
            ),
            iconSize: 28.0.h,
            onPressed: () {
              _onItemTapped(0);
            },
          ),
          IconButton(
            splashRadius: 2,
            padding: EdgeInsets.zero,
            icon: WildrIcon(
              _selectedIndex == 1
                  ? WildrIcons.search_filled
                  : WildrIcons.search_outline,
              color: _getSelectedUnselectedColor(1),
            ),
            iconSize: 30.0.w,
            onPressed: () {
              _onItemTapped(1);
            },
          ),
          const BottomAppBarCreatePostButton(),
          IconButton(
            splashRadius: 2,
            padding: EdgeInsets.zero,
            icon: WildrIcon(
              _selectedIndex == 2
                  ? WildrIcons.challenge_filled
                  : WildrIcons.challenge_outline,
              color: _getSelectedUnselectedColor(2),
            ),
            iconSize: 30.0.w,
            onPressed: () {
              _onItemTapped(2);
            },
          ),
          IconButton(
            splashRadius: 2,
            padding: EdgeInsets.zero,
            icon: WildrIcon(
              _selectedIndex == 3
                  ? WildrIcons.user_filled
                  : WildrIcons.user_outline,
              color: _getSelectedUnselectedColor(3),
            ),
            iconSize: 30.0.w,
            onPressed: () {
              if (_mainBloc.isLoggedIn) {
                if (_isFirstTimeSwitchingToProfileTab) {
                  _mainBloc.add(GetCurrentUserPostsEvent(null, ''));
                  _isFirstTimeSwitchingToProfileTab = false;
                }
                _onItemTapped(3);
              } else {
                Common().openLoginPage(context.router);
              }
            },
          ),
        ],
      );

  Widget _hideViewOnlyMode() => GestureDetector(
        onLongPress: () {
          _mainBloc.add(ToggleViewOnlyModeEvent(false));
        },
        child: RepaintBoundary(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                iconSize: 28.0.w,
                splashRadius: 20,
                icon: Icon(
                  Icons.touch_app_rounded,
                  color: (Get.theme.brightness == Brightness.dark)
                      ? Colors.white
                      : Colors.black87,
                ),
                splashColor: WildrColors.primaryColor,
                onPressed: () {
                  ScaffoldMessenger.of(context).removeCurrentSnackBar();
                  Common().showSnackBar(
                    context,
                    _appLocalizations.comm_longPressToExitViewMode,
                  );
                },
              ),
            ],
          ),
        ),
      );

  BottomAppBar _bottomAppBar() => BottomAppBar(
        height: kBottomNavigationBarHeight,
        elevation: 0,
        child: Container(
          decoration: const BoxDecoration(
            border: Border(
              top: BorderSide(
                color: Color.fromRGBO(128, 128, 128, 0.4),
              ),
            ),
          ),
          padding: EdgeInsets.symmetric(horizontal: 16.0.w, vertical: 4.0.h),
          child: RepaintBoundary(
            child: _viewOnlyMode ? _hideViewOnlyMode() : _bottomAppBarRow(),
          ),
        ),
      );

  Widget _content() {
    final List<Widget> pages = [
      FeedPage(
        _mainBloc,
        isLoggedIn: isUserLoggedIn,
        shouldRefreshFeed: widget.shouldRefreshFeed,
      ),
      const SearchPage(shouldShowBackButton: false),
      const ChallengesTab(),
      const CurrentUserProfilePage(),
    ];

    const List<String> routeNames = [
      'FeedPageRoute',
      SearchPageRoute.name,
      'NotificationsPageRoute',
      CurrentUserProfilePageRoute.name,
    ];

    return PageView(
      onPageChanged: (index) => FirebaseAnalytics.instance
          .setCurrentScreen(screenName: routeNames[index]),
      controller: _pageController,
      allowImplicitScrolling: true,
      physics: const NeverScrollableScrollPhysics(),
      children: pages,
    );
  }

  Widget _body() => BlocListener<MainBloc, MainState>(
        bloc: _mainBloc,
        listener: (context, state) {
          _mainBlocListener(state);
        },
        child: Stack(
          children: [
            _content(),
            Padding(
              padding: EdgeInsets.all(6.0.sp),
              child: Visibility(
                visible: _shouldShowBanner(context),
                child: banner != null
                    ? UpsellBannerWidget(
                        banner: banner!,
                        onDismissed: () {
                          setState(() {
                            banner = null;
                          });
                        },
                        onTap: () {
                          unawaited(
                            FirebaseAnalytics.instance.logEvent(
                              name: BannerEvents.kBannerTapped,
                              parameters: {
                                AnalyticsParameters.kBannerId: banner!.id,
                              },
                            ),
                          );
                          context.pushRoute(
                            const WildrCoinBenefitsPageRoute(),
                          );
                          setState(() {
                            banner = null;
                          });
                        },
                      )
                    : const SizedBox(),
              ),
            ),
          ],
        ),
      );

  void _mainBlocListener(MainState state) {
    if (state is LogoutForcefullyState) {
      context.router.popUntilRoot();
      Common().openLoginPage(context.router);
      Common().showSnackBar(
        context,
        _appLocalizations.comm_loginSignUpToProceed,
      );
    }
    if (state is AuthenticationSuccessfulState) {
      _getBanner();
      setState(() {});
    } else if (state is AppUnauthenticatedState) {
      _selectedIndex = 0;
      if (_pageController.hasClients) {
        _pageController.jumpToPage(0);
      }
      setState(() {});
    } else if (state is CheckForceUpdateState) {
      if (state.shouldShowForceUpdate) {
        Common().showForceUpdateDialog(context);
      } else {
        Prefs.setInt(
          PrefKeys.kForceUpdateLastChecked,
          DateTime.now().millisecondsSinceEpoch,
        );
      }
    } else if (state is HomeFeedUpdateState) {
      if (!state.isSuccessful) {
        debugPrint('Feed failed');
      }
    } else if (state is NavigateToTab) {
      _onItemTapped(state.tab.index);
    } else if (state is ThemeBrightnessToggeledState) {
      debugPrint('Theme Toggled ${Get.isDarkMode}');
    } else if (state is NewPostCreatedState) {
      final String object;
      if (state.isStory) {
        object = _appLocalizations.comm_story;
      } else if (state.parentChallengeId != null) {
        object = _appLocalizations.comm_entry;
      } else {
        object = _appLocalizations.comm_post;
      }
      Common().showSnackBar(
        context,
        'Your $object is up! 🎉',
        showIcon: true,
        icon: const WildrIcon(
          WildrIcons.check_circle_outline,
          color: WildrColors.white,
        ),
      );
    } else if (state is RepostCreatedState) {
      Common().showSnackBar(
        context,
        "${state.isStory ? 'Story' : 'Post'} reposted successfully",
      );
    } else if (state is ToggleViewOnlyModeState) {
      _viewOnlyMode = state.hideAll;
      setState(() {});
    } else if (state is SendEmailAndShowDialogState) {
      _mainBloc.add(RequestVerificationEmailEvent());
      showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => const EmailVerificationDialogBox(),
      );
    } else if (state is UpdateUserPostTypeInterestsState) {
      Prefs.setBool(PrefKeys.kHasAlreadyShownCategoriesDialog, value: true);
    } else if (state is ShowInnerCircleOnboardingState) {
      _showInnerCircleDialog();
    } else if (state is FinishOnboardingState) {
      if (state.onboardingType == OnboardingType.CHALLENGES) {
        // Navigate to the challenges tab.
        _onItemTapped(2);
      }
      // Refresh the current user details to get latest onboarding stats
      // from server.
      _mainBloc.add(
        RefreshCurrentUserDetailsEvent(Common().currentUserId(context)),
      );
    } else if (state is CanShowBannerState) {
      banner = state.banner;
      setState(() {});
    } else if (state is TokenRetrivalTakingLongerState) {
      // TODO: Log firebase event
      Common().showSnackBar(
        context,
        _appLocalizations.comm_tokenRetrievalTakingLonger,
        showIcon: true,
        millis: 4000,
        icon: (Platform.isAndroid)
            ? const Icon(
                Icons.signal_wifi_statusbar_connected_no_internet_4,
                color: WildrColors.white,
              )
            : const Icon(
                CupertinoIcons.wifi_exclamationmark,
                color: WildrColors.white,
              ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    _mainBloc.currentContext = context;
    return FGBGNotifier(
      onEvent: (event) {
        debugPrint('HOME PAGE EVENT -> $event');
        FirebaseAnalytics.instance.logEvent(
          name: '${AnalyticsEvents.kFGBG}_${event.name}',
          parameters: {
            AnalyticsParameters.kIsConnected: _mainBloc.isConnected.toString(),
          },
        );
        switch (event) {
          case FGBGType.foreground:
            Common().delayIt(
              () {
                _mainBloc
                  // ..add(ReloadFirebaseUserEvent())
                  ..checkAndRedeemInviteCode()
                  ..add(GetFeatureFlagsEvent());
                _getBanner();
              },
              millisecond: 1000,
            );
          case FGBGType.background:
            break;
        }
        setState(() {});
      },
      child: Stack(
        children: [
          OverlayTooltipScaffold(
            controller: _tooltipController,
            preferredOverlay: ChallengeEducationOverlayActions(
              tooltipController: _tooltipController,
            ),
            builder: (context) => Scaffold(
              bottomNavigationBar: _bottomAppBar(),
              body: _body(),
            ),
          ),
          if (_intent != null) ...[
            Container(
              height: Get.height,
              width: Get.width,
              color: Theme.of(context).colorScheme.background,
            ),
            const Center(
              child: WildrIcon(
                WildrIcons.wildr_filled,
                size: 88.0,
                color: WildrColors.primaryColor,
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showInnerCircleDialog() {
    context.pushRoute(const OnboardingInnerCircleRoute());
  }

  @override
  bool get wantKeepAlive => true;
}
