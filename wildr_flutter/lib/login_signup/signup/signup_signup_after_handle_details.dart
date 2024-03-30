import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/home/model/pronoun.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';

class SignupAfterHandleDetails {
  String? email;
  String? name;
  LoginType loginType;
  dynamic credentials;
  dynamic details;
  Pronoun? pronoun;
  DateTime? birthday;
  List<ChallengeCategoryType>? categories;

  SignupAfterHandleDetails({
    this.email,
    this.name,
    required this.loginType,
    this.credentials,
    this.details,
    this.pronoun,
    this.birthday,
    this.categories,
  });
}
