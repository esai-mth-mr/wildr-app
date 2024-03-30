// ignore_for_file: invalid_use_of_visible_for_testing_member

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:bloc/bloc.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_app_badger/flutter_app_badger.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/auth/wildr_fcm_token_provider.dart';
import 'package:wildr_flutter/bloc/network/network_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_notifications/model/user_activity.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_config.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_state_and_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_state.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/home/model/wildr_user_with_token.dart';
import 'package:wildr_flutter/home/model/wildr_verified.dart';
import 'package:wildr_flutter/main_common.dart';
import 'package:wildr_flutter/services/invite_code_actions.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

part 'main_bloc_ext_auth.dart';
part 'main_bloc_ext_auth_login.dart';
part 'main_bloc_ext_auth_logout.dart';
part 'main_bloc_ext_event_handlers.dart';
part 'main_bloc_ext_fcm.dart';
part 'main_bloc_ext_firebase_analytics.dart';
part 'main_bloc_ext_gql_isolate_bloc_states.dart';
part 'main_event.dart';
part 'main_state.dart';

const reportDoneText = 'We will review it within the next 24 hours.';

void print(dynamic message) {
  debugPrint('MainBloc: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ MainBloc: $message');
}

class MainBloc extends Bloc<MainBlocEvent, MainState> {
  MainBloc({
    required this.networkBloc,
    required this.analytics,
    required this.messaging,
    required this.currentContext,
    required this.gqlBloc,
    this.serverUrl,
  }) : super(EmptyState()) {
    logCustomEvent(DebugEvents.kMainBlocInit);
    _initAuth();
    _registerEventHandlers();
    _initPackageInfo();
    _initFeatureFlags();
    _listenToGQLIsolateBlocState();
    _initDeviceMetaForAnalytics();
    _registerNetworkBlocListener();
  }

  final WildrGqlIsolateBlocWrapper gqlBloc;
  final NetworkBloc networkBloc;
  final FirebaseAnalytics analytics;
  final FirebaseMessaging messaging;
  late final CurrentUserProfileGxC currentUserGxC = Get.put(
    CurrentUserProfileGxC(),
    tag: CURRENT_USER_TAG,
    permanent: true,
  );
  late FeatureFlagsConfig featureFlagsConfig;
  late final auth = WildrAuth();
  String? serverUrl;
  BuildContext currentContext;
  double height = 0;
  double bottomPadding = 0;
  String? deviceVersion;
  String? deviceModel;
  String? deviceId;
  PackageInfo _packageInfo = PackageInfo(
    appName: 'loading...',
    packageName: 'loading...',
    version: 'loading...',
    buildNumber: 'loading...',
    buildSignature: 'loading...',
  );
  bool contentPreferencePageWentThroughSignUp = false;

  // ignore: prefer_final_fields
  bool _isFirstTimeRefreshingUser = true;
  bool feedBackDialogOpen = false;
  bool shouldAddTraces = true;
  bool isUsingLocalJwtToken = false;

  String savedMessageId = '';

  bool get isLoggedIn => auth.isLoggedIn;

  WildrUser get currentUser => currentUserGxC.user;

  String get currentUserId => currentUser.id;

  void _initFeatureFlags() {
    featureFlagsConfig = FeatureFlagsConfig.fromPrefsOrDefault();
  }

  bool get isConnected => networkBloc.isConnected;

  void _registerNetworkBlocListener() {
    networkBloc.stream.listen((state) {
      if (state is NetworkConnectedState) {
        _sendGqlEvent(UpdateNetworkEvent(false));
      } else if (state is NetworkDisconnectedState) {
        _sendGqlEvent(UpdateNetworkEvent(true));
      }
    });
  }

  Future<void> _initPackageInfo() async {
    _packageInfo = await PackageInfo.fromPlatform();
  }

  Future<void> _serverUrlChanged(ServerUrlChangedEvent event) async {
    add(PerformLogoutEvent());
  }

  Future<void> _onUserRefreshedFirstTime() async {
    print('Setting firebase user id ${currentUserGxC.user.id}');
    await FirebaseAnalytics.instance.setUserId(id: currentUserGxC.user.id);
    await FirebaseCrashlytics.instance
        .setUserIdentifier(currentUserGxC.user.id);
    _showInnerCircleDialog();
    checkAndRedeemInviteCode();
  }

  void _showInnerCircleDialog() {
    if (currentUserGxC.user.onboardingStats.innerCircle) return;
    if (contentPreferencePageWentThroughSignUp) return;
    emit(ShowInnerCircleOnboardingState());
  }

  void checkAndRedeemInviteCode() {
    debugPrint('checkAndRedeemInviteCode');
    final String? hasAction =
        Prefs.getString(PrefKeys.kDynamicLinkHasInviteCodeAction);
    final int? inviteCode = Prefs.getInt(PrefKeys.kReferralOrInviteCode);
    if (hasAction != null && inviteCode != null) {
      add(CheckInviteCodeEvent(inviteCode));
    }
  }

  Future<void> _sendGqlEvent(MainBlocEvent event) async {
    await gqlBloc.add(event);
  }

  Future<void> clearCredIfMismatchDuringLogin() async {
    print('currentUserGxC.user.id.isEmpty: ${currentUserGxC.user.id.isEmpty}');
    print('current user id: ${currentUserGxC.user.id}');
    if (isLoggedIn && currentUser.id.isEmpty) {
      print('MISMATCH');
      await FirebaseAnalytics.instance.setUserId();
      add(ResetGServiceGqlIsolateEvent());
      await auth.removeFirebaseCredentials();
      _resetFeed();
    }
  }
}
