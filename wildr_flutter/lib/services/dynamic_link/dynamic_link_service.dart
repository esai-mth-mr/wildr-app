import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/services/dynamic_link/fdl_intent_service.dart';
import 'package:wildr_flutter/services/dynamic_link/fdl_params_to_prefs_service.dart';

void print(dynamic message) {
  debugPrint('[DynamicLinkService] $message');
}

class DynamicLinkService {
  StreamSubscription? _subscription;
  late BuildContext _context;
  bool shouldRunAction = false;
  int reSubscribeCount = 0;
  FDLIntentService intentService;
  FDLParamsToPrefsService paramsToPrefsService;
  Function(HomePageIntent intent)? _updateSnapshotCallback;

  DynamicLinkService(this.intentService, this.paramsToPrefsService);

  /// @return [HomePageIntent] if the app is first opened from a dynamic link.
  /// Uses [FirebaseDynamicLinks.instance.getInitialLink]
  ///
  /// If the app was resumed from a dynamic link, the [HomePageIntent] will be
  /// handled by [Common.handleHomePageIntent], check [_listenToStream]
  ///
  Future<HomePageIntent?> handleDynamicLinks(
    BuildContext context, {
    bool checkPendingData = true,
    Function(HomePageIntent intent)? updateSnapshotCallback,
  }) async {
    assert(
      checkPendingData || updateSnapshotCallback != null,
      'updateSnapshotCallback must not be null when checkPendingData is false',
    );
    _context = context;
    if (!checkPendingData) {
      _updateSnapshotCallback = updateSnapshotCallback;
    }
    if (checkPendingData) {
      print('Check pending data');
      return _prepareHomePageIntentFromDeepLink(
        await FirebaseDynamicLinks.instance.getInitialLink(),
        isInitialLink: true,
      );
    } else {
      _listenToStream();
      return null;
    }
  }

  void _listenToStream() {
    print('Listen to stream');
    _subscription = FirebaseDynamicLinks.instance.onLink
        .listen(_prepareHomePageIntentFromDeepLink)
      ..onError((e, stack) {
        FirebaseCrashlytics.instance.recordError(
          e,
          stack,
          information: [
            {'count': reSubscribeCount},
          ],
        );
        print(e.message.toString());
      })
      ..onDone(() {
        _resubscribeToStream();
      });
  }

  HomePageIntent? _prepareHomePageIntentFromDeepLink(
    PendingDynamicLinkData? data, {
    isInitialLink = false,
  }) {
    print(
      '_handleDeepLink() isInitialLink: $isInitialLink '
      'isNull ${data == null}',
    );
    if (data == null) return null;
    if (!shouldRunAction && !isInitialLink && _updateSnapshotCallback == null) {
      print('cannot proceed cause even _updateSnapshotCallback is null');
      return null;
    }
    _logDynamicLinkOpenEvent(data);
    paramsToPrefsService.handleParams(data.link);
    final HomePageIntent? intent = intentService.prepareIntent(data);
    if (intent == null) return null;
    if (shouldRunAction) {
      HomePageIntentHandler().handleHomePageIntent(
        intent,
        Common().mainBloc(_context),
        _context.router,
      );
    } else if (_updateSnapshotCallback != null) {
      print('Triggering snapshot callback');
      _updateSnapshotCallback?.call(intent);
    }
    return intent;
  }

  void _logDynamicLinkOpenEvent(PendingDynamicLinkData data) {
    Common().mainBloc(_context).logCustomEvent(
      AnalyticsEvents.kDynamicLinkOpen,
      {
        'path': data.link.path,
        ...data.link.queryParameters,
        ...data.utmParameters,
      },
    );
  }

  void _resubscribeToStream() {
    if (!canResubscribe) return;
    reSubscribeCount++;
    _listenToStream();
  }

  /// 3 is just an arbitrary number. Didn't want to make it infinite.
  /// If it failed 3 times, don't see why it would work the 4th time.
  bool get canResubscribe => reSubscribeCount < 3;

  void cancelStream() {
    _subscription?.cancel();
  }
}
