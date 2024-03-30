class AnalyticsEvents {
  static const kDynamicLinkOpen = 'DynamicLinkOpen';
  static const kAddressBookPermission = 'AddressBookPermission';
  static const kICContactsPage = 'ICContactsPage';
  static const kICOnboardingStarted = 'ICOnboardingStarted';
  static const kICOnboardingSkipped = 'ICOnboardingSkipped';
  static const kNotificationPressed = 'NotificationPressed';
  static const kWildrVerifiedFailed = 'WildrVerifiedFailed';
  static const kConsumedExploreFeed = 'ConsumedExploreFeed';
  static const kTapPostShareButton = 'Tap_PostShareButton';
  static const kTapInviteCode = 'Tap_InviteCode';
  static const kTapInnerCircleInviteCode = 'Tap_InnerCircleInviteCode';
  static const kTapShareChallenge = 'Tap_ShareChallenge';
  static const kTapAddFromContact = 'Tap_AddFromContact';
  static const kLogoutOn401 = 'LogoutOn401';
  static const kFGBG = 'FGBG';
}

class ButtonTapEvents extends AnalyticsEvents {
  static const kCreateV1PostPickImage = 'Tap_CreatePostV1PickImage';
  static const kCreateV1PostPickVideo = 'Tap_CreatePostV1PickVideo';
  static const kCreateV1EnableCameraAccess =
      'Tap_CreatePostV1EnableCameraAccess';
  static const kCreateV1EnableMicrophoneAccess =
      'Tap_CreatePostV1EnableMicrophoneAccess';
  static const kLogout = 'Tap_Logout';
}

class LoginAnalyticsEvents extends AnalyticsEvents {
  static const kContinueWithGoogle = 'Login_ContinueWithGoogle';
  static const kContinueWithApple = 'Login_ContinueWithApple';
  static const kContinueWithEmailOrPhone = 'Login_ContinueWithEmailOrPhone';
}

class DebugLoginAnalyticsEvents extends LoginAnalyticsEvents {
  static const kLoginPageInitialized = 'd_Login_Init';
  static const kPerformFirebaseSignInFailedNoInternet =
      'd_Login_PerformFBSignupNoInternet';
  static const kGoogleSignInFailed = 'd_Login_GoogleSignInFailed';
  static const kAppleSignInFailed = 'd_Login_AppleSignInFailed';
  static const kEmailSignInFailed = 'd_Login_EmailSignInFailed';
  static const kLoginEmailFBAuthException = 'd_Login_LoginEmailFBAuthException';
  static const kLoginEmailUnknownException =
      'd_Login_LoginEmailUnknownException';
  static const kUserDetailsFirebaseUserNull =
      'd_Login_UserDetailsFirebaseUserNull';
  static const kHandleUserDetailsAfterGettingFirebaseDetails =
      'd_Login_UserDetailsAfterFBDetails';
  static const kWildrAuthNotLoggedIn = 'd_Login_WildrAuthNotLoggedIn';
  static const kNullToken = 'd_Login_NullToken';
  static const kCurrentUserPhoneNumberNull =
      'd_Login_CurrentUserPhoneNumberNull';
  static const kReturningFromHandleUserDetailsFunOnPhoneNumber =
      'd_Login_ReturningFromHandleUserDetails';
  static const kCurrentUserEmailNull = 'd_Login_CurrentUserEmailNull';
  static const kCheckPhoneNumberAccountExistsState =
      'd_Login_CheckPhNoAccountExists';
}

class DebugPhoneLoginAnalyticsEvents extends LoginAnalyticsEvents {
  static const kFunctionCall = 'd_PhoneLogin_FunctionCall';
  static const kCodeSent = 'd_PhoneLogin_CodeSent';
  static const kOnResendCode = 'd_PhoneLogin_OnResendCode';
  static const kOtpVerificationId = 'd_PhoneLoginOtpVerificationId';
  static const kOtpError = 'd_PhoneLogin_OtpError';
  static const kHandleOtpInput = 'd_PhoneLogin_HandleOtpInput';
  static const kOTPPageOnBackPressed = 'd_PhoneLogin_OTPPageOnBackPressed';
  static const kVerifyPhoneLogin = 'd_PhoneLogin_VerifyPhoneLogin';
  static const kVerificationCompleted = 'd_PhoneLogin_VerificationCompleted';
  static const kVerificationFailed = 'd_PhoneLogin_VerificationFailed';
  static const kOtpErrorFirebaseException =
      'd_PhoneLogin_OtpErrorFirebaseException';
  static const kPerformSignupFirebaseCurrentUserNull =
      'd_PhoneLogin_Signup_FBCurrentUserNull';
}

class WildrVerifiedEvents extends AnalyticsEvents {
  static const kTakePhotoCTA = 'Tap_TakePhotoCTA';
  static const kChoosePhotoCTA = 'Tap_ChoosePhotoCTA';
}

class DebugEvents extends AnalyticsEvents {
  static const kHomePageInit = 'd_HomePageInit';
  static const kHandleAuthState = 'd_HandleAuthState';
  static const kAuthBlocUserRemoved = 'd_AuthBlocUserRemoved';
  static const kFirebaseUserChange = 'd_FirebaseAuthUserChange';
  static const kFirebaseUserIsNull = 'd_FirebaseUserIsNull';
  static const kMainBlocInit = 'd_MainBlocInit';
  static const kDebugGetFirebaseTokenUnhandledException =
      'd_GetFirebaseTokenException';
  static const kDebugFallbackImage = 'd_FallbackImage';
  static const kDebugGetFCMTokenUnhandledException = 'd_GetFCMTokenException';
  static const kDebugRemoveFBAuthOnFreshInstall =
      'd_RemoveFBAuthOnFreshInstall';
}

class DebugGetIdTokenEvents extends DebugEvents {
  static const kJwtTokenRetry = 'd_GetIdToken_Retry';
  static const kFirebaseAuthException = 'd_GetIdToken_FirebaseAuthException';
  static const kPlatformException = 'd_GetIdToken_PlatformException';
  static const kTokenNullException = 'd_GetIdToken_TokenNullException';
  static const kIsForceRefresh = 'd_GetIdToken_IsForceRefresh';
}

class BannerEvents extends DebugEvents {
  static const kBannerIgnored = 'BannerIgnored';
  static const kBannerTapped = 'Tap_Banner';
}

class OnboardingEvents extends AnalyticsEvents {
  static const kTapCreateAccount = 'Onboarding_Tap_CreateAccount';
  static const kTapSkip = 'Onboarding_Tap_Skip';
  static const kTapSignIn = 'Onboarding_Tap_SignIn';
}
