// ignore_for_file: invalid_use_of_visible_for_testing_member
part of 'package:wildr_flutter/bloc/main/main_bloc.dart';

extension MainBlocExtGqlIsolateBlocStates on MainBloc {
  void _listenToGQLIsolateBlocState() {
    gqlBloc.stream.listen((state) async {
      if (state is LogFirebaseState) {
        logFirebaseEvent(state);
      } else if (state is GqlIsolateLoginSuccessfulState) {
        await _onGqlIsolateLoginSignupSuccessfulState(state);
      } else if (state is GqlIsolateSignupSuccessfulState) {
        await _onGqlIsolateLoginSignupSuccessfulState(state);
        await Prefs.remove(PrefKeys.kPendingSignup);
      } else if (state is CurrentUserProfileRefreshState) {
        print('CurrentUserProfileRefreshState... ');
        if (state.user != null && isLoggedIn) {
          currentUserGxC.updateUser(state.user!);
        }
        print('userId = $currentUserId');
        if (_isFirstTimeRefreshingUser) {
          _isFirstTimeRefreshingUser = false;
          await _onUserRefreshedFirstTime();
        }
        await _updateCurrentUserToPrefs();
        emit(state);
      } else if (state is RemovePrefKeyState) {
        await Prefs.remove(state.key);
      } else if (state is NewPostCreatedState) {
        if (!state.isStory) currentUserGxC.stats.postCount++;
        emit(state);
      } else if (state is PerformLogoutFromGqlIsolateState) {
        logMainBlocEvent(AnalyticsEvents.kLogoutOn401);
        add(PerformLogoutEvent(isForcefullyLoggingUserOut: true));
      } else if (state is UpdateFcmTokenGqlIsolateState) {
        _onUpdateFcmTokenGqlIsolateState(state);
      } else if (state is DeleteFCMTokenAndProceedWithLogoutState) {
        print('DeleteFCMTokenAndProceedWithLogoutState!');
        await _startLogoutProcess();
      } else if (state is CheckInviteCodeResultState) {
        if (state.errorMessage == null) {
          debugPrint('CheckInviteCodeResultState is successful, removing keys');
          await Prefs.remove(PrefKeys.kDynamicLinkHasInviteCodeAction);
          await Prefs.remove(PrefKeys.kReferralOrInviteCode);
          if (state.payload != null) {
            _handleCheckAndRedeemPayload(state.payload!);
          }
        }
      } else if (state is WildrVerifyState) {
        currentUserGxC.user.wildrVerifiedVerificationStatus =
            WildrVerifiedStatus.PENDING_REVIEW;
        add(RefreshCurrentUserDetailsEvent(currentUserGxC.user.id));
        emit(state);
      } else if (state is GetFeatureFlagsState) {
        _onGetFeatureFlagsState(state);
      } else {
        emit(state);
      }
    });
  }

  void _handleCheckAndRedeemPayload(String payload) {
    // debugPrint('_handleCheckAndRedeemPayload()');
    debugPrint(payload);
    final Map<String, dynamic> data = json.decode(payload);
    if (data['body'] != null) {
      Common().showGetSnackBar(
        data['body'],
        snackPosition: SnackPosition.TOP,
        isDisplayingError: true,
      );
    }
    Common().handleNotificationTap(data, currentContext);
  }

  void _onGetFeatureFlagsState(GetFeatureFlagsState state) {
    if (state.config == null) return;
    featureFlagsConfig = state.config!;
    featureFlagsConfig.saveToPrefs();
  }
}
