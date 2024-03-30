// ignore_for_file: no_default_cases
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:logger/logger.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth_token_provider.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/api_wrappers.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolated_api_wrappers.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/logger/app_logging.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

enum Environment { LOCAL, DEV, DEV2, STAGING, PROD }

extension ParseEnvironment on Environment {
  String getUrl() {
    switch (this) {
      case Environment.LOCAL:
        return dotenv.get(
          'LOCAL_SERVER_URL',
          fallback: 'http://localhost:4000/graphql',
        );
      case Environment.DEV:
        return 'https://wildr-dev-2-new.api.dev.wildr.com/graphql';
      case Environment.DEV2:
        return 'https://wildr-dev-2.api.dev.wildr.com/graphql';
      case Environment.STAGING:
        return 'https://staging.api.wildr.com/graphql';
      case Environment.PROD:
        return 'https://api.wildr.com/graphql';
    }
  }

  String getDynamicLinkUrlPrefix() {
    switch (this) {
      case Environment.LOCAL:
        return 'https://dev.wildr.com';
      case Environment.DEV:
        return 'https://dev.wildr.com';
      case Environment.DEV2:
        return 'https://dev.wildr.com';
      case Environment.STAGING:
        return 'https://wildrstaging.page.link';
      case Environment.PROD:
        return 'https://wildr.com';
    }
  }

  String getDynamicLinkUrl() {
    switch (this) {
      case Environment.LOCAL:
        return 'https://dev.wildr.com';
      case Environment.DEV:
        return 'https://dev.wildr.com';
      case Environment.DEV2:
        return 'https://dev.wildr.com';
      case Environment.STAGING:
        return 'https://wildrstaging.page.link';
      case Environment.PROD:
        return 'https://wildr.com';
    }
  }

  String getDynamicLinkFirstSharePostPathSegment() {
    switch (this) {
      case Environment.PROD:
        return 'post';
      default:
        return 'share';
    }
  }

  String getFlavourName() {
    switch (this) {
      case Environment.PROD:
        return 'prod';
      default:
        return 'dev';
    }
  }

  String getPackageName() {
    switch (this) {
      case Environment.PROD:
        return 'com.wildr.app';
      default:
        return 'com.wildr.dev';
    }
  }

  String getAppStoreId() => '1604130204';

  String getGooglePlayStoreId() {
    switch (this) {
      case Environment.PROD:
        return 'com.wildr.app';
      default:
        return 'com.wildr.dev';
    }
  }

  String getBaseWebsiteUrl() {
    switch (this) {
      case Environment.PROD:
        return 'https://wildr.com';
      default:
        return 'https://dev.wildr.com';
    }
  }
}

Future<SharedPreferences> doRituals(Environment env, {String? url}) async {
  final SharedPreferences preferences = await Prefs.init();
  final PackageInfo packageInfo = await PackageInfo.fromPlatform();
  if (env == Environment.PROD && !kDebugMode) {
    debugPrint = (message, {wrapWidth}) {};
  }
  WildrAuth.init(
    WildrFirebaseAuthTokenProvider(),
    WildrFirebaseAuth(FirebaseAuth.instance),
  );
  if (preferences.getBool(PrefKeys.kHasCompletedOnboarding) != true) {
    // on Fresh App Install
    if (WildrAuth().isLoggedIn) {
      await WildrAuth().removeFirebaseCredentials();
      await FirebaseAnalytics.instance.logEvent(
        name: DebugEvents.kDebugRemoveFBAuthOnFreshInstall,
      );
    }
  }
  await initializeIsolateBloc(
    () => initGqlIsolateBloc(
      env,
      preferences.getString(PrefKeys.kLastSelectedFeedType) ??
          FeedScopeType.PERSONALIZED_FOLLOWING.name,
      url: url,
      packageInfo: packageInfo,
    ),
  );
  return preferences;
}

void initGqlIsolateBloc(
  Environment env,
  String feedScopeTypeStr, {
  String? url,
  required PackageInfo packageInfo,
}) {
  registerIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>(
    create: () => GraphqlIsolateBloc(
      serverUrl: url ?? Environment.DEV2.getUrl(),
      env: env,
      selectedFeedScopeTypeStr: feedScopeTypeStr,
      packageInfo: packageInfo,
    ),
  );
}

extension LoggingSetup on Logging {
  // Initial setup of logging depending on environment.
  static Future<void> initialize(Environment env) async {
    // Configure logger
    Logger.level = env == Environment.DEV ? Level.debug : Level.info;
    // TODO: Enable once ready for prod.
    if (env == Environment.DEV) {
      await AppFileOutput().initializeLogFile();
    }
  }
}
