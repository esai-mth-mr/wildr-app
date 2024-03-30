// ignore_for_file: invalid_use_of_visible_for_testing_member
part of 'main_bloc.dart';

extension MainBlocExtAuthLogout on MainBloc {
  Future<void> _onPerformLogoutEvent(
    Emitter emit,
    PerformLogoutEvent event,
  ) async {
    print('Perform Logout!');
    if (!auth.isLoggedIn && !kDebugMode) {
      debugPrint('_performLogout() CurrentUser = null');
      logCustomEvent(DebugEvents.kFirebaseUserIsNull, {
        'caller': '_performLogout',
      });
      await _startLogoutProcess(event.isForcefullyLoggingUserOut);
      _isFirstTimeRefreshingUser = true;
      return;
    }
    if (event.isForcefullyLoggingUserOut) {
      await _startLogoutProcess(event.isForcefullyLoggingUserOut);
    } else {
      // Will trigger _startLogoutProcess
      // via DeleteFCMTokenAndProceedWithLogoutState
      await _sendGqlEvent(UpdateFcmTokenAndProceedLogoutEvent(''));
    }
  }

  // TODO: Should update isolate bloc wrapper to not accept any other event
  /// Is also triggered from [DeleteFCMTokenAndProceedWithLogoutState]
  Future<void> _startLogoutProcess([
    bool? shouldOpenLoginPage,
  ]) async {
    print('_startLogoutProcess');
    logCustomEvent(DebugEvents.kAuthBlocUserRemoved);
    await auth.removeFirebaseCredentials();
    _clearCurrentUserObj();
    _clearPrefsOnLogout();
    await FirebaseAnalytics.instance.setUserId();
    await _onAuthBlocLogoutSuccessfulState();
    if (shouldOpenLoginPage ?? false) emit(LogoutForcefullyState());
  }

  Future<void> _onAuthBlocLogoutSuccessfulState() async {
    print('_onAuthBlocLogoutSuccessfulState');
    await _sendGqlEvent(ResetGServiceGqlIsolateEvent());
    add(AppUnauthenticatedEvent());
    _resetFeed();
  }

  void _resetFeed() {
    add(UpdateHomeFeedVariablesEvent(FeedPostType.ALL, FeedScopeType.GLOBAL));
    emit(
      OnFeedScopeTypeChangedState(
        postType: FeedPostType.ALL,
        scopeType: FeedScopeType.GLOBAL,
        isAuthenticated: false,
      ),
    );
  }

  void _clearCurrentUserObj() {
    currentUserGxC.clear();
  }

  void _clearPrefsOnLogout() {
    Prefs.remove(PrefKeys.kCurrentUserWithToken);
    Prefs.remove(PrefKeys.kFCMStatus);
    Prefs.remove(PrefKeys.kLastSelectedFeedType);
    Prefs.remove(PrefKeys.kPostSettings);
  }
}
