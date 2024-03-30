part of 'login_page.dart';

extension LoginPageStateSignup on LoginPageState {
  void _onAskForHandleAndNameState(AskForHandleAndNameState state) {
    context.loaderOverlay.hide();
    _loginGxC.isSignUp.value = true;
    if (_loginType == LoginType.EMAIL &&
        !FirebaseAuth.instance.currentUser!.emailVerified) return;
    // These sign up details are set when coming from the Challenges
    // onboarding page, where we set the details before logging in.
    final SignupAfterHandleDetails details = _prepareSignupDetails(state)
      ..pronoun = widget.pronoun
      ..birthday = widget.birthday
      ..categories = widget.categories;
    if (_loginType == LoginType.EMAIL &&
        _loginGxC.wentToEmailVerificationPage) {
      print('Replacing WaitForEmailVerificationPage');
      context
          .replaceRoute(AskForHandleAndSignUpPageRoute(signUpDetails: details))
          .then(_onAskForHandleAndSignUpPagePop);
    } else {
      context
          .pushRoute(AskForHandleAndSignUpPageRoute(signUpDetails: details))
          .then(_onAskForHandleAndSignUpPagePop);
    }
  }

  Future<void> _onAskForHandleAndSignUpPagePop(didManuallyPop) async {
    _loginGxC.isSubmitting = false;
    print('didManuallyPop $didManuallyPop');
    if (didManuallyPop == true) {
      await FirebaseAnalytics.instance.setUserId();
      _mainBloc.add(ResetGServiceGqlIsolateEvent());
      await WildrAuth().removeFirebaseCredentials();
      _loginGxC
        ..emailVerificationSentFromServer = false
        ..clearOTPData();
    }
    print('Popping until here');
    if (_loginGxC.wentToEmailVerificationPage) {
      await context.popRoute();
    }
  }

  SignupAfterHandleDetails _prepareSignupDetails(
    AskForHandleAndNameState state,
  ) {
    final SignupAfterHandleDetails signupDetails =
        _loginType.getSignupAfterHandleDetails(
      _emailEC.text,
      _passwordEC.text,
    );
    return signupDetails;
  }
}
