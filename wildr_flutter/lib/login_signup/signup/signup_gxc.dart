import 'dart:async';

import 'package:get/get.dart';

class SignupGxC extends GetxController {
  RxBool isSubmitting = false.obs;

  RxString nameEM = ''.obs;
  RxString usernameEM = ''.obs;
  RxString emailEM = ''.obs;
  RxString phNoEM = ''.obs;
  RxString passEM = ''.obs;

  //Otp
  RxString otpEM = ''.obs;
  RxBool showOtpTextField = false.obs;
  String otpVerificationId = '';
  int resendToken = 0;
  String fullPhoneNumber = '';
  RxInt rxTimer = 0.obs;
  bool inCodeRetrievalWindow = false;
  RxBool canProceed = false.obs;

  Timer? timer;

  void startTimer() {
    timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (timer.isActive && timer.tick == 60) {
        timer.cancel();
      }
      rxTimer.value = timer.tick;
    });
  }

  void cancelTimer() {
    timer?.cancel();
    timer = null;
  }

  RxBool shouldProvideRetryOption = false.obs;

  void clear() {
    isSubmitting.value = false;
    shouldProvideRetryOption.value = false;
    showOtpTextField.value = false;
    nameEM.value = '';
    usernameEM.value = '';
    emailEM.value = '';
    phNoEM.value = '';
    otpEM.value = '';
    resendToken = 0;
    cancelTimer();
  }
}
