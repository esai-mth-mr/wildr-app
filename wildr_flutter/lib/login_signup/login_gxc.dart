import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

class LoginGetController extends GetxController {
  final RxBool isSignUp = false.obs;

  //EM = ErrorMessage
  final RxBool _isSubmitting = false.obs;
  final RxBool _emailOrPhoneNumberExists = false.obs;

  set isSubmitting(bool value) {
    _isSubmitting.value = value;
  }

  set emailOrPhoneNumberExists(bool value) {
    _emailOrPhoneNumberExists.value = value;
  }

  bool get isSubmitting => _isSubmitting.value;

  bool get emailOrPhoneNumberExists => _emailOrPhoneNumberExists.value;

  final RxString emailEM = ''.obs;
  final RxString passEM = ''.obs;
  final RxString phNoEM = ''.obs;
  final RxString otpEM = ''.obs;
  final RxString phoneNumber = ''.obs;
  final RxString emailAddress = ''.obs;
  final RxString password = ''.obs;
  String fullPhoneNumber = '';
  String? otpVerificationId;
  int? resendToken;

  RxInt rxPhoneNumberTimerValue = 0.obs;

  Timer? phoneNumberTimer;

  void startPhoneNumberTimer() {
    phoneNumberTimer?.cancel();
    phoneNumberTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (timer.isActive && timer.tick >= kPhoneOTPTimeoutSecs) {
        timer.cancel();
        rxPhoneNumberTimerValue.value = 0;
        phoneNumberTimer?.cancel();
      }
      rxPhoneNumberTimerValue.value = timer.tick;
    });
  }

  bool wentToEmailVerificationPage = false;
  Timer? emailVerificationTimer;
  RxInt emailVerificationTimerValue = 0.obs;
  bool didSendEmailVerification = false;
  bool emailVerificationSentFromServer = false;

  void startEmailVerificationTimer() {
    didSendEmailVerification = true;
    emailVerificationTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (t.isActive && t.tick >= 60) {
        didSendEmailVerification = false;
        emailVerificationTimerValue.value = 0;
        t.cancel();
        emailVerificationTimer?.cancel();
      }
      emailVerificationTimerValue.value = t.tick;
    });
  }

  void _cancelTimer() {
    debugPrint('[LoginGxC] Cancel Timer()');
    phoneNumberTimer?.cancel();
    phoneNumberTimer = null;
    rxPhoneNumberTimerValue.value = 0;
  }

  void cancelEmailVerificationTimer() {
    emailVerificationTimer?.cancel();
    emailVerificationTimer = null;
  }

  bool get inCodeRetrievalWindow => phoneNumberTimer != null;

  void clearOTPData() {
    otpVerificationId = null;
    resendToken = null;
    _cancelTimer();
  }
}

const kPhoneOTPTimeoutSecs = 30;
