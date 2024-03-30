import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class WildrUserWithToken {
  late String? token;
  late WildrUser user;

  WildrUserWithToken.fromCurrentUserGxC(CurrentUserProfileGxC currentUserGxC)
      : token = currentUserGxC.localServerJwtToken,
        user = currentUserGxC.user;

  WildrUserWithToken.fromLoginData(Map<String, dynamic> data) {
    final login = data['login'];
    token = login['jwtToken'];
    user = WildrUser.fromUserObj(login['user'], isCurrentUser: true);
  }

  WildrUserWithToken.fromData(Map<String, dynamic> data, String key) {
    final login = data[key];
    token = login['jwtToken'];
    user = WildrUser.fromUserObj(login['user'], isCurrentUser: true);
  }

  WildrUserWithToken.fromSignUpData(Map<String, dynamic> data) {
    final obj = data['signUpWithEmail'];
    token = obj['jwtToken'];
    user = WildrUser.fromUserObj(obj['user'], isCurrentUser: true);
  }

  WildrUserWithToken.fromJson(Map<String, dynamic> json)
      : token = json['token'],
        user = WildrUser.fromJson(json['user']);

  Map<String, dynamic> toJson() => {'token': token, 'user': user.toJson()};
}
