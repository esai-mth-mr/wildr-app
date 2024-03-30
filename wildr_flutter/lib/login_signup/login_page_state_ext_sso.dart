part of 'login_page.dart';

extension SSOonLoginPageState on LoginPageState {
  Future<UserDetails> _signInWith3rdParty() async {
    try {
      if (_loginType == LoginType.GOOGLE || _loginType == LoginType.APPLE) {
        return _loginType.signIn();
      } else {
        throw Exception('Only use this method for 3rd party');
      }
    } catch (error) {
      print('SIGN IN WITH APPLE FAILED $error');
      return UserDetails(shouldShowErrorMessage: true);
    }
  }

  void _onContinueWithGoogle() {
    Common()
        .mainBloc(context)
        .logCustomEvent(LoginAnalyticsEvents.kContinueWithGoogle);
    _performFirebaseSignIn(LoginType.GOOGLE);
  }

  void _onContinueWithApple() {
    Common()
        .mainBloc(context)
        .logCustomEvent(LoginAnalyticsEvents.kContinueWithApple);
    _performFirebaseSignIn(LoginType.APPLE);
  }
}
