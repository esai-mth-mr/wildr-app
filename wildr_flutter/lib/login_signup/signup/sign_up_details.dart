import 'dart:io';

import 'package:wildr_flutter/feat_challenges/models/categories.dart';

class SignupDetails {
  late String? email;
  late String? password;
  late String? phoneNumber;
  late String? name;
  late String handle;
  late String? gender;
  late String? language;
  late File? profileImage;
  String? token;
  String? uid;
  DateTime? birthday;
  List<ChallengeCategoryType>? categories;
  bool isFirebaseSignupWithEmailSuccessful = false;
  bool isFirebaseSignupWithPhoneNumberSuccessful = false;
  int signupOption = 0; // 0 = Both; 1 = Email; 2 = Phone

  SignupDetails({
    this.email,
    this.password,
    this.phoneNumber,
    required this.name,
    required this.handle,
    this.gender,
    this.language,
    this.profileImage,
    this.token,
    this.uid,
    this.birthday,
    this.categories,
  });
}

enum InputType {
  EMAIL_ONLY,
  PHONE_NUMBER_ONLY,
  BOTH,
  NONE,
}
