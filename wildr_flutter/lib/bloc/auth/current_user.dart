import 'package:wildr_flutter/home/model/wildr_user.dart';

class CurrentUser {
  late String token;
  late WildrUser user;

  CurrentUser.fromLoginData(Map<String, dynamic> data) {
    final login = data['login'];
    token = login['jwtToken'];
    user = WildrUser.fromUserObj(login['user'], isCurrentUser: true);
  }

  CurrentUser.fromData(Map<String, dynamic> data, String key) {
    final login = data[key];
    token = login['jwtToken'];
    user = WildrUser.fromUserObj(login['user'], isCurrentUser: true);
  }

  CurrentUser.fromSignUpData(Map<String, dynamic> data) {
    final obj = data['signUpWithEmail'];
    token = obj['jwtToken'];
    user = WildrUser.fromUserObj(obj['user'], isCurrentUser: true);
  }

  CurrentUser.fromJson(Map<String, dynamic> json)
      : token = json['token'],
        user = WildrUser.fromJson(json['user']) {
    //debugPrint("CURRENT USER fromJson =>  $json");
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'user': user.toJson(),
      };
}
