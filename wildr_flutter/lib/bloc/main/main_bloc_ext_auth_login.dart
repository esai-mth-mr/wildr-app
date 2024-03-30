// ignore_for_file: invalid_use_of_visible_for_testing_member
part of 'main_bloc.dart';

extension MainBlocExtAuthLogin on MainBloc {
  Future<void> _onJwtTokenAvailable(
    Emitter emit,
    JwtTokenAvailableEvent event,
  ) async {
    print('_onJwtTokenAvailable');
    await _sendGqlEvent(RefreshFirebaseJwtToken(event.jwtToken));
    await _sendGqlEvent(AppendUserIdToHeaderEvent(currentUserGxC.user.id));
    await _sendGqlEvent(CancelHomeFeedSubscriptionsEvent());
    await _sendGqlEvent(GetFeatureFlagsEvent());
    await _sendGqlEvent(UpdateCurrentUserObjEvent(currentUserGxC.user));
    _sendEmailVerificationEmail();
    await Common().delayInPlace(500);
    _getFeedAfterLogin(emit);
    add(RefreshCurrentUserDetailsEvent(currentUserGxC.user.id));
    // TODO should be called from profile page
    await _sendGqlEvent(GetCurrentUserPostsEvent(currentUserGxC.user.id, ''));
    emit(AuthenticationSuccessfulState());
    Common().delayIt(_setupFCM, millisecond: 500);
  }

  void _getFeedAfterLogin(Emitter emit) {
    FeedScopeType scopeType = FeedScopeType.PERSONALIZED;
    final String? lastSelectedFeedTypeStr =
        Prefs.getString(PrefKeys.kLastSelectedFeedType);
    if (lastSelectedFeedTypeStr != null) {
      scopeType = FeedScopeType.values.byName(lastSelectedFeedTypeStr);
    }
    add(GetFeedEvent(scopeType: scopeType));
    emit(
      OnFeedScopeTypeChangedState(
        postType: FeedPostType.ALL,
        scopeType: scopeType,
        isAuthenticated: true,
      ),
    );
  }

  void _sendEmailVerificationEmail() {
    if (auth.isEmailProviderButNotVerified()) {
      if (!auth.hasOnlyPhoneNumberProvider()) {
        add(SendEmailAndShowDialogEvent());
      }
    }
  }

  Future<void> _onGqlIsolateLoginSignupSuccessfulState(
    GqlIsolateLoginSignupSuccessfulState state,
  ) async {
    debugPrint('AuthLoginSuccessfulEvent');
    currentUserGxC.setUserWithToken(state.user);
    await _saveUserWithTokenToPrefs(state.user);
    await _fetchTokenAndFireAuthEvent();
  }
}
