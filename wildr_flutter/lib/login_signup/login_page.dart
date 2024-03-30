// ignore_for_file: avoid_redundant_argument_values

import 'package:auto_route/auto_route.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/analytics/analytics_common.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/email_fb_auth_provider.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/auth/wildr_fcm_token_provider.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/bloc/theme/theme_bloc.dart';
import 'package:wildr_flutter/bloc/theme/theme_state.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_state.dart';
import 'package:wildr_flutter/home/model/pronoun.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';
import 'package:wildr_flutter/login_signup/login_choose_account_type_page.dart';
import 'package:wildr_flutter/login_signup/login_gxc.dart';
import 'package:wildr_flutter/login_signup/signup/signup_signup_after_handle_details.dart';
import 'package:wildr_flutter/login_signup/user_details.dart';
import 'package:wildr_flutter/login_signup/wait_for_email_verification_page.dart';
import 'package:wildr_flutter/routes.gr.dart';

part 'login_page_state_ext_bloc_listeners.dart';
part 'login_page_state_ext_phone_number.dart';
part 'login_page_state_ext_signup.dart';
part 'login_page_state_ext_sso.dart';

void print(dynamic message) {
  debugPrint('[Login Page] $message');
}

class LoginPage extends StatefulWidget {
  final bool isOpenedUsingGet;
  final bool isSignup;
  final Pronoun? pronoun;
  final DateTime? birthday;
  final List<ChallengeCategoryType>? categories;

  const LoginPage({
    super.key,
    this.isOpenedUsingGet = false,
    this.pronoun,
    this.birthday,
    this.categories,
    this.isSignup = false,
  });

  @override
  LoginPageState createState() => LoginPageState();
}

class LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  final TextEditingController _emailEC = TextEditingController();
  final TextEditingController _passwordEC = TextEditingController();
  final TextEditingController _phoneNumberEC = TextEditingController();
  final TextEditingController _otpEC = TextEditingController();
  late LoginGetController _loginGxC;
  late LoginType _loginType;
  int _currentTabIndex = 0;
  bool _isSignup = false;
  UserDetails? _userDetails;
  late final _mainBloc = Common().mainBloc(context);
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  late final TabController _tabController =
      TabController(length: 2, vsync: this)
        ..addListener(() {
          // Set the screen name to the current tab's name when the tab changes.
          if (!_tabController.indexIsChanging) {
            FirebaseAnalytics.instance.setCurrentScreen(
              screenName:
                  '${LoginPageRoute.name}/${_tabController.index == 0 ? 'Phone' : 'Email'}',
            );
          }
          setState(() {
            _currentTabIndex = _tabController.index;
            print('On Tab  CHanged $_currentTabIndex');
          });
        });

  @override
  void initState() {
    super.initState();
    print('LOGIN PAGE INIT STATE!');
    _isSignup = widget.isSignup;
    _logEvent(DebugLoginAnalyticsEvents.kLoginPageInitialized);
    Get.put(LoginGetController());
    _loginGxC = Get.find();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      print('onPostFrameCallback');
      if (widget.isSignup) {
        _onContinueWithEmailOrPhone.call(isSignUp: true).then((value) {
          print('THEN 2');
          _isSignup = false;
          setState(() {});
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    print('------------- isSignup = ${_loginGxC.isSignUp.value}');
    return MultiBlocListener(
      listeners: [
        _mainBlocListener(),
        _themeBlocListener(),
      ],
      child: Stack(
        children: [
          LoginChooseAccountTypeBody(
            onContinueWithGoogle: _onContinueWithGoogle,
            onContinueWithApple: _onContinueWithApple,
            onContinueWithEmailOrPhone: _onContinueWithEmailOrPhone,
          ),
          if (_isSignup) Container(color: Colors.white),
        ],
      ),
    );
  }

  Future<void> _onContinueWithEmailOrPhone({bool isSignUp = false}) {
    print('CONTINUE WITH EMAIL OR PHONE');
    _logEvent(LoginAnalyticsEvents.kContinueWithEmailOrPhone);
    _loginGxC.isSignUp.value = isSignUp;
    return context
        .pushRoute(
      LoginEmailOrPhonePageRoute(
        phoneNumberTextEditingController: _phoneNumberEC,
        emailTextEditingController: _emailEC,
        passwordTextEditingController: _passwordEC,
        onEmailContinuePressed: () {
          _performFirebaseSignIn(LoginType.EMAIL);
        },
        onEmailContinueLongPress: _debugLogin,
        onPhoneSendVerificationCodePressed: () {
          _performFirebaseSignIn(LoginType.PHONE);
        },
      ),
    )
        .then((value) {
      print('THen 1');
      if (!_mainBloc.isLoggedIn) {
        _loginGxC.isSignUp.value = false;
        if (_isSignup) context.popRoute();
      }
    });
  }

  Future<void> _debugLogin() async {
    print('DebugLogin...');
    _loginType = LoginType.EMAIL;
    if (FlavorConfig.getFlavorName() == 'prod') {
      return;
    }
    final LoginGetController loginGxC = Get.find();
    if (loginGxC.isSubmitting) return;
    final email = _emailEC.text;
    final password = _passwordEC.text;
    var shouldReturn = false;
    if (email.isEmpty) {
      loginGxC.emailEM.value =
          _appLocalizations.login_signup_emailCanNotBeEmpty;
      shouldReturn = true;
    }
    if (password.isEmpty) {
      loginGxC.passEM.value =
          _appLocalizations.login_signup_passwordCanNotBeEmpty;
      shouldReturn = true;
    }
    if (shouldReturn) return;
    Common().mainBloc(context).add(
          PerformDebugLoginEvent(
            email,
            password,
            await WildrFcmTokenProvider().getFcmToken(),
          ),
        );
  }

  Future<void> _performFirebaseSignIn(LoginType type) async {
    print('_performFirebaseSignIn $type');
    if (!_mainBloc.networkBloc.isConnected) {
      _logEvent(
        DebugLoginAnalyticsEvents.kPerformFirebaseSignInFailedNoInternet,
      );
      Common().showErrorSnackBar(kNoInternetError);
      return;
    }
    await _firebaseAuth.signOut();
    _loginGxC.isSubmitting = true;
    switch (type) {
      case LoginType.GOOGLE:
        context.loaderOverlay.show();
        try {
          _loginType = LoginType.GOOGLE;
          _userDetails = await _signInWith3rdParty();
        } catch (e) {
          _mainBloc.logMainBlocEvent(
            DebugLoginAnalyticsEvents.kGoogleSignInFailed,
            parameters: {
              AnalyticsParameters.kDebugStackTrace:
                  trimStackTrace(e.toString()),
            },
          );
          _loginGxC.isSubmitting = false;
        }
      case LoginType.APPLE:
        context.loaderOverlay.show();
        try {
          _loginType = LoginType.APPLE;
          _userDetails = await _signInWith3rdParty();
        } catch (e) {
          _mainBloc.logMainBlocEvent(
            DebugLoginAnalyticsEvents.kAppleSignInFailed,
            parameters: {
              AnalyticsParameters.kDebugStackTrace:
                  trimStackTrace(e.toString()),
            },
          );
          _loginGxC.isSubmitting = false;
        }
      case LoginType.EMAIL:
        _loginType = LoginType.EMAIL;
        _loginGxC.isSubmitting = true;
        _userDetails = await _loginUsingEmailAndPassword();
      case LoginType.PHONE:
        if (_phoneNumberEC.text == '') {
          _onLoginSignupError(
            _appLocalizations.login_signup_enterNumberToProceedMessage,
          );
          return;
        }
        print('Sign in via phone number');
        _loginGxC.isSubmitting = true;
        _loginType = LoginType.PHONE;
        _mainBloc
            .add(CheckPhoneNumberAccountExistsEvent(_loginGxC.fullPhoneNumber));
        return;
    }
    final userDetails = _userDetails;
    if (userDetails == null) {
      print('USER DETAILS = null');
      context.loaderOverlay.hide();
      _loginGxC.isSubmitting = false;
      return;
    } else if (userDetails.firebaseUser == null) {
      context.loaderOverlay.hide();
      if (userDetails.shouldShowErrorMessage) {
        _logEvent(DebugLoginAnalyticsEvents.kUserDetailsFirebaseUserNull);
        print('UserDetails Firebase User null = null');
        _onLoginSignupError();
      } else {
        _loginGxC.isSubmitting = false;
      }
      return;
    } else {
      print('setting current user credentials');
    }
    await _handleUserDetailsAfterGettingFirebaseDetails();
  }

  Future<void> _handleUserDetailsAfterGettingFirebaseDetails() async {
    _logEvent(
      DebugLoginAnalyticsEvents.kHandleUserDetailsAfterGettingFirebaseDetails,
    );
    final User currentUser = _userDetails!.firebaseUser!;
    final LoginType type = _userDetails!.signInType;
    if (!WildrAuth().isLoggedIn) {
      _logEvent(DebugLoginAnalyticsEvents.kWildrAuthNotLoggedIn);
      print('Not logged in');
      _onLoginSignupError();
      return;
    }
    final String? token = await WildrAuth()
        .getToken(caller: '_handleUserDetailsAfterGettingFirebaseDetails()');
    if (token == null) {
      _logEvent(DebugLoginAnalyticsEvents.kNullToken);
      print('Token in null');
      _onLoginSignupError();
      return;
    }
    _mainBloc.add(RefreshFirebaseJwtToken(token));
    print('TYPE $type');
    if (type == LoginType.PHONE) {
      if (currentUser.phoneNumber == null) {
        _logEvent(DebugLoginAnalyticsEvents.kCurrentUserPhoneNumberNull);
        _onLoginSignupError();
        return;
      }
      _mainBloc.add(
        FirebaseLoginWithPhoneNumberEvent(
          phoneNumber: currentUser.phoneNumber!,
          token: token,
          uid: currentUser.uid,
          fcmToken: await WildrFcmTokenProvider().getFcmToken(),
        ),
      );
      _logEvent(
        DebugLoginAnalyticsEvents
            .kReturningFromHandleUserDetailsFunOnPhoneNumber,
      );
      return;
    }
    String? fullName;
    fullName = currentUser.displayName ?? _userDetails!.displayName;
    if (type == LoginType.EMAIL) {
      if (fullName?.isEmpty ?? false) {
        print('IS EMPTY');
        fullName = null;
      }
    }
    if (currentUser.email == null) {
      _logEvent(DebugLoginAnalyticsEvents.kCurrentUserEmailNull);
      _onLoginSignupError("We couldn't fetch your email");
      await WildrAuth().switchEmailToVerifiedEmailIfPossible();
      await currentUser.reload();
      if (FirebaseAuth.instance.currentUser!.email == null) {
        _onLoginSignupError();
        return;
      }
    }
    if (!WildrAuth().isEmailVerified() &&
        WildrAuth().getVerifiedEmail() == null) {
      print("User's email is not verified");
      try {
        if (_loginGxC.didSendEmailVerification &&
            !_loginGxC.wentToEmailVerificationPage) {
          print('Sending to email verification page, already sent the code');
          await _sendToEmailVerificationPage();
          return;
        }
        _mainBloc.add(RequestVerificationEmailEvent());
        return;
      } on FirebaseException catch (e) {
        _mainBloc.logCustomEvent(
            DebugLoginAnalyticsEvents.kLoginEmailFBAuthException, {
          AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
        });
        _loginGxC.isSubmitting = false;
        if (e.code == 'too-many-requests') {
          _onLoginSignupError(
            _appLocalizations.login_signup_tooManyRequestsErrorMessage,
          );
        }
      } catch (e) {
        _mainBloc.logCustomEvent(
            DebugLoginAnalyticsEvents.kLoginEmailUnknownException, {
          AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
        });
        _onLoginSignupError();
        print(e.toString());
      }
    }
    _mainBloc.add(
      FirebaseEmailAuthEvent(
        displayName: fullName,
        email: currentUser.email!,
        phoneNumber: currentUser.phoneNumber,
        photoUrl: currentUser.photoURL,
        token: token,
        uid: currentUser.uid,
        fcmToken: await WildrFcmTokenProvider().getFcmToken(),
      ),
    );
  }

  Future<UserDetails?> _loginUsingEmailAndPassword() async {
    final email = _emailEC.text;
    final password = _passwordEC.text;
    var shouldReturn = false;
    if (email.isEmpty) {
      _loginGxC.emailEM.value =
          _appLocalizations.login_signup_emailCanNotBeEmpty;
      shouldReturn = true;
    }
    if (password.isEmpty) {
      _loginGxC.passEM.value =
          _appLocalizations.login_signup_passwordCanNotBeEmpty;
      shouldReturn = true;
    }
    setState(() {});
    if (shouldReturn) return null;
    try {
      _loginGxC.emailEM.value = '';
      _loginGxC.passEM.value = '';
      if (_loginGxC.isSignUp.value) {
        setState(() {});
        return UserDetails(
          firebaseUser:
              (await EmailFBAuthProvider(email: email, password: password)
                      .signUp())
                  .user,
          signInType: LoginType.EMAIL,
        );
      } else {
        return await LoginType.EMAIL.signIn(email: email, password: password);
      }
    } on FirebaseAuthException catch (e) {
      print('❌❌ _loginUsingEmailAndPassword() $e');
      _mainBloc.logMainBlocEvent(
        DebugLoginAnalyticsEvents.kLoginEmailFBAuthException,
        parameters: {
          AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
        },
      );
      if (e.code == 'weak-password') {
        _loginGxC.emailEM.value = '';
        _loginGxC.passEM.value =
            e.message ?? _appLocalizations.login_signup_weakPassword;
        setState(() {});
        return null;
      } else if (e.code == 'email-already-in-use') {
        _loginGxC.emailEM.value =
            _appLocalizations.login_signup_emailAlreadyInUse;
        _loginGxC.passEM.value = '';
        setState(() {});
        return null;
      }
      _loginGxC.emailEM.value =
          _appLocalizations.login_signup_invalidCredentials;
      _loginGxC.passEM.value =
          _appLocalizations.login_signup_invalidCredentials;
      setState(() {});
      if (e.code == 'user-not-found') {
        _loginGxC.emailEM.value = '';
        _loginGxC.passEM.value = '';
        setState(() {});
        _loginGxC.emailOrPhoneNumberExists = true;
        print('No user found for that email.');
      } else if (e.code == 'wrong-password') {
        print('Wrong password provided for that user.');
      }
      return null;
    } catch (e) {
      _mainBloc.logMainBlocEvent(
        DebugLoginAnalyticsEvents.kLoginEmailUnknownException,
        parameters: {
          AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
        },
      );
      print(e.toString());
      _onLoginSignupError();
      return null;
    }
  }

  Future<void> _onRequestVerificationEmailState(
    RequestVerificationEmailState state,
  ) async {
    if (state.message != null) {
      _onLoginSignupError(state.message ?? kSomethingWentWrong);
      _loginGxC.emailVerificationSentFromServer = false;
      _setState(() {});
      return;
    }
    _loginGxC.isSubmitting = false;
    if (_loginGxC.emailVerificationSentFromServer) return;
    _loginGxC
      ..emailVerificationSentFromServer = true
      ..startEmailVerificationTimer();
    if (!_loginGxC.wentToEmailVerificationPage) {
      print('Sending to email verification page');
      await _sendToEmailVerificationPage();
    }
  }

  Future<void> _sendToEmailVerificationPage() async {
    final email = WildrAuth().getEmailAddressFromLoginType(LoginType.EMAIL);
    if (email == null) {
      _loginGxC
        ..emailVerificationSentFromServer = false
        ..wentToEmailVerificationPage = false
        ..clearOTPData();
      _onLoginSignupError();
      return;
    }
    print('_sendToEmailVerificationPage...');
    _loginGxC.wentToEmailVerificationPage = true;
    await context
        .pushRoute(
      WaitForEmailVerificationPageRoute(
        isSignUp: _loginGxC.isSignUp.isTrue,
        showUnlink: WildrAuth().getAllProviderTypes().length > 1,
        email: email,
        type: EmailVerificationType.SIGNUP,
      ),
    )
        .then((value) async {
      _loginGxC
        ..isSubmitting = false
        ..emailVerificationSentFromServer = false
        ..wentToEmailVerificationPage = false
        ..clearOTPData();
    });
  }

  void _onLoginSignupError([String? message]) {
    _mainBloc.add(RefreshFirebaseJwtToken(null));
    context.loaderOverlay.hide();
    _loginGxC.isSubmitting = false;
    Common().showSnackBar(
      context,
      message ?? kSomethingWentWrong,
      isDisplayingError: true,
    );
  }

  void _setState(VoidCallback fn) {
    setState(fn);
  }

  void _logEvent(String eventName) {
    _mainBloc.logCustomEvent(eventName);
  }

  @override
  void dispose() {
    //DO NOT CANCEL TIMER HERE
    _mainBloc.clearCredIfMismatchDuringLogin();
    _loginGxC.isSignUp.value = false;
    _loginGxC.isSubmitting = false;
    _loginGxC.passEM.value = '';
    _loginGxC.emailEM.value = '';
    _loginGxC.phNoEM.value = '';
    _loginGxC.emailAddress.value = '';
    _loginGxC.password.value = '';
    _loginGxC.phoneNumber.value = '';
    _emailEC.dispose();
    _passwordEC.dispose();
    _phoneNumberEC.dispose();
    _otpEC.dispose();
    super.dispose();
  }
}
