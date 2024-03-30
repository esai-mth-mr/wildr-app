// ignore_for_file: invalid_use_of_visible_for_testing_member, no_default_cases
part of 'main_bloc.dart';

extension MainBlocFCM on MainBloc {
  Future<void> _setupFCM() async {
    await _requestAndGetNotificationPermissions();
    await _manageFCMToken();
  }

  Future<bool> _requestAndGetNotificationPermissions() async {
    try {
      final NotificationSettings settings = await messaging.requestPermission();
      switch (settings.authorizationStatus) {
        case AuthorizationStatus.authorized:
        case AuthorizationStatus.provisional:
          return true;
        default:
          return false;
      }
    } catch (e, stack) {
      await FirebaseCrashlytics.instance.recordError(
        e,
        stack,
        reason: '_requestAndGetNotificationPermissions() '
            'Failed to requestPermission',
      );
      return false;
    }
  }

  Future<void> _manageFCMToken() async {
    final String? token;
    try {
      token = await WildrFcmTokenProvider().getFcmToken();
    } catch (exception, stack) {
      await FirebaseCrashlytics.instance.recordError(
        exception,
        stack,
        reason: '_manageFCMToken() Failed to get FCM token',
      );
      return;
    }
    if (token == null) {
      debugPrint('[manageFCMToken] [Token is null');
      return;
    }
    // Save the initial token to the database
    await _saveFCMTokenToPrefsAndToTheServer(token);
    // Any time the token refreshes, store this in the database too.
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      logCustomEvent('debug-FCMTokenRefresh');
      _saveFCMTokenToPrefsAndToTheServer(token);
    });
    if (Platform.isIOS) {
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
        alert: true, // Required to display a heads up notification
        badge: true,
        sound: true,
      );
    } else if (Platform.isAndroid) {
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'high_importance_channel', // id
        'Wildr Notifications', // title
        description: 'Activity notifications', // description
        importance: Importance.max,
      );
      final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
          FlutterLocalNotificationsPlugin();
      await flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
    FirebaseMessaging.onMessage.listen(_onFirebaseMessage);
    await _setupInteractedMessage();
  }

  void _onFirebaseMessage(RemoteMessage message) {
    debugPrint('_onFirebaseMessage() Message data: ${message.data}');
    if (message.notification != null) {
      if (savedMessageId != message.messageId) {
        savedMessageId = message.messageId!;
        _refreshCurrentUserActivity();
        _refreshUserDetailsOnNotification(message.data);
        debugPrint(
          'Message also contained a notification: '
          '${message.notification?.body}',
        );
        add(RefreshCurrentUserDetailsEvent(currentUserGxC.user.id));
        Get.showSnackbar(
          GetSnackBar(
            snackPosition: SnackPosition.TOP,
            message: message.data['body'] ?? '--',
            barBlur: 0.6,
            forwardAnimationCurve: Curves.easeOut,
            duration: const Duration(seconds: 4),
            icon: const WildrIcon(WildrIcons.bell_filled, color: Colors.white),
            backgroundColor: WildrColors.snackBarErrorColor,
            mainButton: TextButton(
              onPressed: () {
                Common().handleNotificationTap(message.data, currentContext);
              },
              child: const Text('View'),
            ),
            onTap: (obj) {
              Common().handleNotificationTap(message.data, currentContext);
            },
          ),
        );
      } else {
        return;
      }
    } else {
      debugPrint('No notification');
    }
  }

  Future<void> _saveFCMTokenToPrefsAndToTheServer(String token) async {
    // print("_saveTokenToPrefsAndToTheServer()");
    final FCMStatus status = FCMStatus(token);
    final FCMStatus? prevStats = _getFCMStatusFromPrefs();
    if (prevStats != null &&
        token == prevStats.token &&
        prevStats.isUpdatedAtServer) {
      debugPrint('No need to update FCM token on server');
      return;
    }
    await Prefs.setString(PrefKeys.kFCMStatus, jsonEncode(status));
    await _sendGqlEvent(UpdateFcmTokenToServerGqlIsolateEvent(token));
    status.isUpdatedAtServer = true;
    await Prefs.setString(PrefKeys.kFCMStatus, jsonEncode(status));
  }

  Future<void> _setupInteractedMessage() async {
    final RemoteMessage? initialMessage =
        await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleNotificationTap(RemoteMessage message) {
    FlutterAppBadger.removeBadge();
    debugPrint('_handleMessage ${message.toString()}');
    debugPrint("Notification -> ${message.notification?.body ?? '-'}");
    debugPrint('Notification -> ${message.data}');
    Common().handleNotificationTap(message.data, currentContext);
    _refreshCurrentUserActivity();
    _refreshUserDetailsOnNotification(message.data);
  }

  void _onUpdateFcmTokenGqlIsolateState(UpdateFcmTokenGqlIsolateState state) {
    final FCMStatus? status = _getFCMStatusFromPrefs();
    if (status == null) return;
    status.isUpdatedAtServer = state.isSuccessful;
    Prefs.setString(PrefKeys.kFCMStatus, jsonEncode(status));
  }

  FCMStatus? _getFCMStatusFromPrefs() {
    final String? prevStatusJSON = Prefs.getString(PrefKeys.kFCMStatus);
    if (prevStatusJSON != null) {
      try {
        final Map<String, dynamic> json = jsonDecode(prevStatusJSON);
        final FCMStatus prevStats = FCMStatus.fromJson(json);
        return prevStats;
      } catch (e, stackTrace) {
        FirebaseCrashlytics.instance.recordError(e, stackTrace);
      }
    }
    return null;
  }

  void _refreshCurrentUserActivity() {
    debugPrint('_refreshCurrentUserActivity');
    emit(RequestPaginateCurrentUserActivityEventState());
  }

  // The use seem to be deprecated as of Nov 23, 2023
  void _refreshUserDetailsOnNotification(Map<String, dynamic> dataPayload) {
    final UserActivityVerbEnum verb =
        UserActivity.getVerb(dataPayload['verb'] ?? '');
    if (verb == UserActivityVerbEnum.COMMENT_EMBARGO_LIFTED) {
      currentUserGxC.user.commentEnabledAt = DateTime.now();
    } else if (verb == UserActivityVerbEnum.IMPROVED_PROFILE_RING) {
      if (dataPayload['score'] != null) {
        currentUserGxC.user.score = double.parse(dataPayload['score']);
      }
    }
  }
}

class FCMStatus {
  String token = '';
  bool isUpdatedAtServer = false;

  Map<String, dynamic> toJson() =>
      {'token': token, 'isUpdatedAtServer': isUpdatedAtServer};

  FCMStatus(this.token);

  FCMStatus.fromJson(Map<String, dynamic> json)
      : token = json['token'],
        isUpdatedAtServer = json['isUpdatedAtServer'];
}
