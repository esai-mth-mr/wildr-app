import 'package:country_picker/country_picker.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:lottie/lottie.dart';
import 'package:wildr_flutter/animations/fade_in_animation.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/bloc/network/network_bloc.dart';
import 'package:wildr_flutter/bloc/theme/theme_bloc.dart';
import 'package:wildr_flutter/bloc/theme/theme_state.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/bloc/challenges_common_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/awards_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/invites_bloc.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/i18n/i18n.dart';
import 'package:wildr_flutter/onboarding/page/onboarding_v3.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/services/dynamic_link/dynamic_link_service.dart';
import 'package:wildr_flutter/services/dynamic_link/fdl_intent_service.dart';
import 'package:wildr_flutter/services/dynamic_link/fdl_params_to_prefs_service.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/log_navigation_routes.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class EntryPoint extends StatefulWidget {
  final bool shouldLogRoutes;

  const EntryPoint({super.key, this.shouldLogRoutes = false});

  @override
  EntryPointState createState() => EntryPointState();
}

class EntryPointState extends State<EntryPoint> {
  final _appRouter = AppRouter(Get.key);

  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, constraints) => MultiBlocProvider(
          providers: [
            BlocProvider(
              create: (context) =>
                  NetworkBloc(analytics: FirebaseAnalytics.instance),
            ),
            BlocProvider<MainBloc>(
              create: (context) => MainBloc(
                gqlBloc:
                    createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>(),
                networkBloc: BlocProvider.of<NetworkBloc>(context),
                analytics: FirebaseAnalytics.instance,
                messaging: FirebaseMessaging.instance,
                currentContext: context,
                serverUrl: FlavorConfig.getValue(kServerUrl),
              ),
            ),
            BlocProvider(create: (context) => ThemeBloc()),
            //TODO: Remove it
            BlocProvider(
              create: (context) => ChallengesCommonBloc(
                gqlBloc: Common().mainBloc(context).gqlBloc,
              ),
            ),
            BlocProvider<CoinWaitlistBloc>(
              create: (context) => CoinWaitlistBloc(),
            ),
            BlocProvider<AwardsBloc>(create: (context) => AwardsBloc()),
            BlocProvider<InvitesBloc>(create: (context) => InvitesBloc()),
          ],
          child: BlocBuilder<ThemeBloc, ThemeState>(
            builder: (context, themeState) =>
                BlocConsumer<NetworkBloc, NetworkState>(
              listener: (context, networkState) {
                if (networkState is NetworkConnectedState) {
                  debugPrint('Connected');
                } else if (networkState is NetworkDisconnectedState) {
                  debugPrint('Disconnected');
                }
              },
              builder: (context, state) => GlobalLoaderOverlay(
                useDefaultLoading: false,
                overlayOpacity: 0.7,
                overlayColor: Colors.black87,
                overlayWidget: Center(
                  child: FadeInAnimation(
                    duration: const Duration(milliseconds: 300),
                    child: Lottie.asset(
                      'assets/animations/loader.json',
                      height: 250,
                    ),
                  ),
                ),
                child: GetMaterialApp.router(
                  title: 'Wildr',
                  supportedLocales: I18n.all,
                  localizationsDelegates: const [
                    AppLocalizations.delegate,
                    CountryLocalizations.delegate,
                    GlobalMaterialLocalizations.delegate,
                    GlobalCupertinoLocalizations.delegate,
                    GlobalWidgetsLocalizations.delegate,
                  ],
                  debugShowCheckedModeBanner: false,
                  theme: themeState.themeData,
                  routerDelegate: _appRouter.delegate(
                    navigatorObservers: () => [
                      FirebaseAnalyticsObserver(
                        analytics: FirebaseAnalytics.instance,
                      ),
                      if (widget.shouldLogRoutes) LogRoutes(),
                    ],
                  ),
                  routeInformationParser: _appRouter.defaultRouteParser(),
                ),
              ),
            ),
          ),
        ),
      );
}

class EntryPage extends StatefulWidget {
  const EntryPage({super.key});

  @override
  State<EntryPage> createState() => _EntryPageState();
}

class _EntryPageState extends State<EntryPage> {
  late final Future<HomePageIntent?> _dynamicLinkFutureHandler;

  HomePageIntent? _intentFromCallback;

  final DynamicLinkService _dynamicLinkService =
      DynamicLinkService(FDLIntentService(), FDLParamsToPrefsService());

  @override
  void initState() {
    super.initState();
    _dynamicLinkFutureHandler = _dynamicLinkService.handleDynamicLinks(context);
    _dynamicLinkService.handleDynamicLinks(
      context,
      checkPendingData: false,
      updateSnapshotCallback: (intent) =>
          setState(() => _intentFromCallback = intent),
    );
  }

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        bloc: Common().mainBloc(context),
        listener: (_, state) {
          if (state is AuthStateChangedState) {
            debugPrint('[EntryPoint] OnAuthStateChanged');
            // will trigger _shouldShowOnboarding
            setState(() {});
          }
        },
        child: FutureBuilder(
          future: _dynamicLinkFutureHandler,
          builder: (context, snapshot) {
            debugPrint(
              'Snapshot connection state: ${snapshot.connectionState}',
            );
            if (snapshot.connectionState != ConnectionState.done) {
              return _emptyScreen;
            }
            return _body(snapshot.data);
          },
        ),
      );

  Widget get _emptyScreen => const Scaffold(
        body: Center(
          child: WildrIcon(
            WildrIcons.wildr_filled,
            size: 88.0,
            color: WildrColors.primaryColor,
          ),
        ),
      );

  Widget _body(HomePageIntent? initialLinkIntent) {
    if (_shouldShowOnboarding) {
      return OnboardingV3Page(
        isEntryPoint: true,
        bodyData: _convertIntentToOnboardingPageBody(
          _intentFromCallback ?? initialLinkIntent,
        ),
        onSkipTapped: () => setState(() {
          debugPrint('[EntryPoint] OnSkipTapped');
          // will trigger _shouldShowOnboarding
        }),
      );
    }
    _dynamicLinkService.shouldRunAction = true;
    return HomePage(
      intent: _intentFromCallback ?? initialLinkIntent,
      shouldRefreshFeed: true,
    );
  }

  OnboardingPageBodyData? _convertIntentToOnboardingPageBody(
    HomePageIntent? intent,
  ) =>
      intent != null ? HomePageIntent.toOnboardingPageBody(intent) : null;

  bool get _shouldShowOnboarding =>
      Prefs.getBool(PrefKeys.kHasCompletedOnboarding) != true;
}
