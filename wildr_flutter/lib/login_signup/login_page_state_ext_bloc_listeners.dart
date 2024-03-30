part of 'login_page.dart';

extension LoginPageStateBlocListeners on LoginPageState {
  BlocListener<MainBloc, MainState> _mainBlocListener() =>
      BlocListener<MainBloc, MainState>(
        bloc: _mainBloc,
        listener: (context, state) async {
          if (state is AskForHandleAndNameState) {
            _onAskForHandleAndNameState(state);
          } else if (state is RequestVerificationEmailState) {
            await _onRequestVerificationEmailState(state);
          } else if (state is LoginSignupFailedState) {
            context.loaderOverlay.hide();
            Common().showSnackBar(
              context,
              state.message,
              isDisplayingError: true,
            );
          } else if (state is CheckPhoneNumberAccountExistsState) {
            await _handleCheckPhoneNumberAccountExistsState(state);
          } else if (state is CheckPhoneNumberAccountFailedState) {
            Common().showErrorSnackBar(state.errorMessage);
            _setState(() {
              _loginGxC.isSubmitting = false;
            });
            context.loaderOverlay.hide();
          } else if (state is AuthenticationSuccessfulState) {
            _onLoginSuccessful();
          }
        },
      );

  void _onLoginSuccessful() {
    context.loaderOverlay.hide();
    _loginGxC
      ..emailVerificationSentFromServer = false
      ..wentToEmailVerificationPage = false;
    if (_loginGxC.isSignUp.isTrue) {
      _mainBloc.contentPreferencePageWentThroughSignUp = true;
      context.pushRoute(
        ContentPreferenceOnboardingPageRoute(shouldShowSkip: true),
      );
    } else {
      context.router.popUntilRoot(); // EntryPoint
      Common().showConfirmationSnackBar(
        "You're signed in 😊",
        context,
      );
    }
  }

  BlocListener<ThemeBloc, ThemeState> _themeBlocListener() =>
      BlocListener<ThemeBloc, ThemeState>(
        bloc: BlocProvider.of<ThemeBloc>(context),
        listener: (context, state) {
          Common().delayIt(_setState);
        },
      );
}
