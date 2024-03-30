// ignore_for_file: invalid_use_of_visible_for_testing_member
part of 'package:wildr_flutter/bloc/main/main_bloc.dart';

extension MainBlocAuth on MainBloc {
  Future<void> _initAuth() async {
    _setupCurrentUserGxCFromPrefs();
    await clearCredIfMismatchDuringLogin();
    _subscribeToFirebaseAuth();
    await _fetchTokenAndFireAuthEvent();
  }

  Future<void> _fetchTokenAndFireAuthEvent() async {
    final String? token = await _getToken();
    if (token == null) {
      add(AppUnauthenticatedEvent());
    } else {
      add(AppAuthenticatedEvent(token));
    }
  }

  Future<String?> _getToken() async {
    final String? token;
    if (kDebugMode &&
        FlavorConfig.getValue(kEnvironment) == Environment.LOCAL.name) {
      token = currentUserGxC.localServerJwtToken;
      isUsingLocalJwtToken = true;
    } else {
      token = await auth.getToken(caller: '_initAuth');
    }
    return token;
  }

  void _setupCurrentUserGxCFromPrefs() {
    final str = Prefs.getString(PrefKeys.kCurrentUserWithToken);
    if (str == null) {
      printE('_getCurrentUser is NULL');
      return;
    }
    final userWithToken = WildrUserWithToken.fromJson(jsonDecode(str));
    currentUserGxC
      ..user = userWithToken.user
      ..localServerJwtToken = userWithToken.token;
  }

  Future<void> _saveUserWithTokenToPrefs(WildrUserWithToken user) async {
    currentUserGxC
      ..user = user.user
      ..localServerJwtToken = user.token;
    try {
      await Prefs.setString(PrefKeys.kCurrentUserWithToken, jsonEncode(user));
    } catch (exception, stack) {
      printE(exception.toString());
      await FirebaseCrashlytics.instance.recordError(
        exception,
        stack,
        reason: '_saveUserWithTokenToPrefs',
      );
    }
  }

  Future<void> _updateCurrentUserToPrefs() async {
    if (currentUser.id.isNotEmpty) {
      await Prefs.setString(
        PrefKeys.kCurrentUserWithToken,
        jsonEncode(WildrUserWithToken.fromCurrentUserGxC(currentUserGxC)),
      );
    }
  }

  void _subscribeToFirebaseAuth() {
    FirebaseAuth.instance.userChanges().listen((user) {
      FirebaseAnalytics.instance.logEvent(
        name: DebugEvents.kFirebaseUserChange,
        parameters: {'isNull': (user == null).toString()},
      );
    });
  }

  Future<void> _reloadFirebaseUser() async {
    try {
      await FirebaseAuth.instance.currentUser?.reload();
    } catch (exception, stack) {
      await FirebaseCrashlytics.instance.recordError(exception, stack);
    }
  }

  String? getUserEmail() => currentUserGxC.user.email;
}
