part of 'login_page.dart';

extension PhoneNumberOnLoginPageState on LoginPageState {
  Future<void> _loginInWithPhoneNumber() async {
    _mainBloc.logCustomEvent(DebugPhoneLoginAnalyticsEvents.kFunctionCall);
    print('_loginInWithPhoneNumber');
    _firebaseVerifyAndOpenOtpPageOnCodeSent();
  }

  void _pushOtpVerificationPage() {
    print('_pushOtpVerificationPage()');
    context.pushRoute(
      VerificationPageRoute(
        isSignUp: false,
        onResendCode: (_) {
          _mainBloc
              .logCustomEvent(DebugPhoneLoginAnalyticsEvents.kOnResendCode);
          _firebaseVerifyAndOpenOtpPageOnCodeSent(isFromVerificationPage: true);
        },
        onBackPressed: () {
          _logEvent(DebugPhoneLoginAnalyticsEvents.kOTPPageOnBackPressed);
          _loginGxC
            ..clearOTPData()
            ..isSubmitting = false;
        },
        onChanged: (verificationCode) {
          _otpEC.text = verificationCode;
        },
        onComplete: _handleOtpInput,
        phoneNumber: _loginGxC.fullPhoneNumber,
      ),
    );
  }

  void _firebaseVerifyAndOpenOtpPageOnCodeSent({
    bool isFromVerificationPage = false,
  }) {
    _mainBloc.logCustomEvent(DebugPhoneLoginAnalyticsEvents.kVerifyPhoneLogin, {
      'isFromVerificationPage': isFromVerificationPage.toString(),
    });
    print('_verifyPhoneLogin isFromVerificationPage: $isFromVerificationPage');
    _firebaseAuth.verifyPhoneNumber(
      timeout: Duration.zero,
      phoneNumber: _loginGxC.fullPhoneNumber,
      verificationCompleted: (credential) async {
        _logEvent(DebugPhoneLoginAnalyticsEvents.kVerificationCompleted);
      },
      verificationFailed: (e) {
        print('Verification Failed! $e');
        _mainBloc.logMainBlocEvent(
          DebugPhoneLoginAnalyticsEvents.kVerificationFailed,
          parameters: {'code': e.code},
        );
        _loginGxC.clearOTPData();
        if (e.code == 'invalid-phone-number') {
          _onLoginSignupError('The provided phone number is not valid.');
        } else if (e.code == 'too-many-requests') {
          _onLoginSignupError(e.message);
        } else {
          _onLoginSignupError('Could not verify phone number');
        }
      },
      codeSent: (verificationId, resendToken) {
        print('Code has been sent');
        _mainBloc
            .logCustomEvent(DebugPhoneLoginAnalyticsEvents.kOtpVerificationId, {
          'verificationId': verificationId,
        });
        _loginGxC.startPhoneNumberTimer();
        _mainBloc.logCustomEvent(DebugPhoneLoginAnalyticsEvents.kCodeSent);
        _loginGxC
          ..isSubmitting = false
          ..otpVerificationId = verificationId
          ..resendToken = resendToken;
        if (!isFromVerificationPage) _pushOtpVerificationPage();
      },
      codeAutoRetrievalTimeout: (verificationId) {},
    );
  }

  Future<void> _handleOtpInput(_) async {
    print('HandleOtpInput');
    _logEvent(DebugPhoneLoginAnalyticsEvents.kHandleOtpInput);
    _loginGxC.isSubmitting = true;
    final PhoneAuthCredential credential = PhoneAuthProvider.credential(
      verificationId: _loginGxC.otpVerificationId ?? '',
      smsCode: _otpEC.text,
    );
    print('Signing in with OTP');
    try {
      final cred = await _firebaseAuth.signInWithCredential(credential);
      _userDetails = UserDetails(
        firebaseUser: cred.user,
        phoneNumber: cred.user?.phoneNumber,
        signInType: LoginType.PHONE,
      );
      print(_userDetails.toString());
      _loginGxC.clearOTPData();
      await _handleUserDetailsAfterGettingFirebaseDetails();
    } catch (e, stack) {
      print('OTP ERROR ${e.runtimeType} $e');
      context.loaderOverlay.hide();
      _mainBloc.add(OtpVerificationFailedEvent());
      if (e is FirebaseAuthException) {
        _mainBloc.logMainBlocEvent(
          DebugPhoneLoginAnalyticsEvents.kOtpErrorFirebaseException,
          parameters: {'code': e.code},
        );
        print('OTP ERROR ${e.code} ${e.message}');
        if (e.code == 'invalid-verification-code') {
          _onLoginSignupError(
            'OTP verification failed, please try again',
          );
          return;
        } else if (e.code == 'session-expired') {
          _onLoginSignupError('The SMS code has expired');
          return;
        }
      }
      _mainBloc.logMainBlocEvent(
        DebugPhoneLoginAnalyticsEvents.kOtpError,
        parameters: {
          AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
          LoginAnalyticsParams.kOtpVerificationId:
              _loginGxC.otpVerificationId ?? '',
          LoginAnalyticsParams.kSmsCodeLen: _otpEC.text.length,
        },
      );
      await FirebaseCrashlytics.instance.recordError(
        e,
        stack,
        information: [
          {
            LoginAnalyticsParams.kOtpVerificationId:
                _loginGxC.otpVerificationId ?? '',
            LoginAnalyticsParams.kSmsCodeLen: _otpEC.text.length,
          },
        ],
      );
      _onLoginSignupError();
    }
  }

  Future<void> _handleCheckPhoneNumberAccountExistsState(
    CheckPhoneNumberAccountExistsState state,
  ) async {
    _mainBloc.logCustomEvent(
        DebugLoginAnalyticsEvents.kCheckPhoneNumberAccountExistsState, {
      'phoneNumberAccountExist': state.phoneNumberAccountExist.toString(),
      'isSignup': _loginGxC.isSignUp.value.toString(),
    });
    print('_handleCheckPhoneNumberAccountExistsState');
    if (!state.phoneNumberAccountExist && !_loginGxC.isSignUp.value) {
      Common().showErrorSnackBar(
        "This phone number doesn't exist please proceed to signup",
        context,
      );
      _setState(() {
        _loginGxC
          ..isSubmitting = false
          ..emailOrPhoneNumberExists = true;
      });
      context.loaderOverlay.hide();
    } else if (_loginGxC.isSignUp.value && state.phoneNumberAccountExist) {
      Common().showErrorSnackBar(
        'This phone number is already in use.',
        context,
      );
      _setState(() {
        _loginGxC.isSubmitting = false;
      });
      context.loaderOverlay.hide();
    } else {
      context.loaderOverlay.show();
      await _loginInWithPhoneNumber();
      context.loaderOverlay.hide();
    }
  }
}
