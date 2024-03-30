import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/entry_point.dart';
import 'package:wildr_flutter/main_common.dart';

Future<void> runWildr(Environment env) async {
  await runZonedGuarded<Future<void>>(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await LoggingSetup.initialize(env);
      await Firebase.initializeApp();
      await dotenv.load();
      await doRituals(env, url: env.getUrl());
      FlavorConfig(
        flavorName: env.getFlavourName(),
        values: {
          kEnvironment: env.name,
          kServerUrl: env.getUrl(),
          kDynamicLinkUrlPrefix: env.getDynamicLinkUrlPrefix(),
          kDynamicLinkUrl: env.getDynamicLinkUrl(),
          kDynamicLinkFirstSharePostPathSegment:
              env.getDynamicLinkFirstSharePostPathSegment(),
          kPackageName: env.getPackageName(),
          kAppStoreId: env.getAppStoreId(),
          kGooglePlayId: env.getGooglePlayStoreId(),
          kBaseWebsiteUrl: env.getBaseWebsiteUrl(),
          kCanPrintLogs: false,
        },
      );
      final Function originalOnError = FlutterError.onError!;
      FlutterError.onError = (errorDetails) async {
        if (!kDebugMode) {
          await FirebaseCrashlytics.instance.recordFlutterError(errorDetails);
        }
        originalOnError(errorDetails);
      };
      final shouldLogRoutes =
          dotenv.get('LOG_ROUTES', fallback: 'false') == 'true';
      VisibilityDetectorController.instance.updateInterval =
          const Duration(milliseconds: 100);
      runApp(EntryPoint(shouldLogRoutes: shouldLogRoutes));
    },
    (error, stack) => FirebaseCrashlytics.instance.recordError(error, stack),
  );
}
