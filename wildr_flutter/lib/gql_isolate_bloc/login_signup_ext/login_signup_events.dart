import 'dart:io';

import 'package:http/http.dart';
import 'package:http_parser/http_parser.dart';
import 'package:intl/intl.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/models/categories.dart';
import 'package:wildr_flutter/login_signup/signup/sign_up_details.dart';

class PerformDebugLoginEvent extends MainBlocEvent {
  final String email;
  final String password;
  final String? fcmToken;

  PerformDebugLoginEvent(this.email, this.password, this.fcmToken) : super();

  @override
  bool shouldLogEvent() => false;
}

class FirebaseEmailAuthEvent extends MainBlocEvent {
  final String? displayName;
  final String email;
  final String? phoneNumber;
  final String? photoUrl;
  final String token;
  final String uid;
  final String? fcmToken;

  FirebaseEmailAuthEvent({
    required this.email,
    required this.token,
    required this.uid,
    this.displayName,
    this.phoneNumber,
    this.photoUrl,
    required this.fcmToken,
  });

  Map<String, dynamic> _input() {
    final Map<String, dynamic> input = {
      'email': email,
      'uid': uid,
      'fcmToken': fcmToken,
    };
    if (displayName != null) {
      input['displayName'] = displayName!;
    }
    if (phoneNumber != null) {
      input['phoneNumber'] = phoneNumber!;
    }
    if (photoUrl != null) {
      input['photoUrl'] = photoUrl!;
    }
    return input;
  }

  Map<String, dynamic> getInput() => {'input': _input()};
}

class FirebaseLoginWithPhoneNumberEvent extends MainBlocEvent {
  final String phoneNumber;
  final String token;
  final String uid;
  final String? fcmToken;

  FirebaseLoginWithPhoneNumberEvent({
    required this.phoneNumber,
    required this.token,
    required this.uid,
    required this.fcmToken,
  });

  Map<String, dynamic> _input() {
    final input = {
      'uid': uid,
      'phoneNumber': phoneNumber,
      'fcmToken': fcmToken,
    };
    return input;
  }

  Map<String, dynamic> getInput() => {'input': _input()};
}

class FirebaseSignupEvent extends MainBlocEvent {
  final String? name;
  final String handle;
  final String? email;

  //final String password;
  final String? phoneNumber;
  final String? gender;
  final String? language;
  final String token;
  final String uid;
  final int? inviteCode;
  final String? referralName;
  final String? fcmToken;
  final File? profileImage;
  final DateTime? birthday;
  final List<ChallengeCategoryType>? categories;
  final String? referralChallengeId;
  final int? referralCode;
  final String? referrerHandle;
  final String? referrerId;
  final String? referralSource;

  FirebaseSignupEvent(
    SignupDetails details,
    this.inviteCode,
    this.referralName, {
    required this.fcmToken,
    this.referralChallengeId,
    this.referralCode,
    this.referrerHandle,
    this.referrerId,
    this.referralSource,
  })  : name = details.name,
        handle = details.handle,
        // this.password = details.password!,
        email = details.email,
        phoneNumber = details.phoneNumber,
        gender = details.gender,
        language = details.language,
        token = details.token!,
        uid = details.uid!,
        profileImage = details.profileImage,
        birthday = details.birthday,
        categories = details.categories;

  Future<Map<String, dynamic>> _input() async {
    final Map<String, dynamic> input = {
      'name': name,
      'handle': handle,
      'gender': gender,
      'language': language,
      'uid': uid,
      'fcmToken': fcmToken,
    };
    if (email != null) {
      input['email'] = email;
    }
    if (phoneNumber != null) {
      input['phoneNumber'] = phoneNumber;
    }
    if (inviteCode != null) {
      input['inviteCode'] = inviteCode;
    }
    if (profileImage != null) {
      final avatarByteData = await profileImage!.readAsBytes();
      final imageFile = MultipartFile.fromBytes(
        'image',
        avatarByteData,
        filename: '${DateTime.now().second}.webp',
        contentType: MediaType('image', 'webp'),
      );
      input['image'] = imageFile;
    }
    if (birthday != null) {
      input['birthday'] = DateFormat('yyyy-MM-dd').format(birthday!);
    }
    if (categories != null) {
      input['categoryIds'] =
          categories!.map((category) => category.id).toList();
    }

    return input;
  }

  Future<Map<String, dynamic>> getInput() async => {'input': await _input()};

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        AnalyticsParameters.kChallengeId: referralChallengeId ?? '',
        AnalyticsParameters.kReferralCode: referralCode ?? '',
        AnalyticsParameters.kReferralName: referralName ?? '',
        AnalyticsParameters.kReferrerHandle: referrerHandle ?? '',
        AnalyticsParameters.kReferrerId: referrerId ?? '',
        AnalyticsParameters.kReferralSource: referralSource ?? '',
      };
}

class PerformSignUpEvent extends MainBlocEvent {
  final String name;
  final String username;
  final String password;
  final String? email;
  final String? gender;
  final String? language;

  PerformSignUpEvent(
    this.name,
    this.username,
    this.password,
    this.email,
    this.gender,
    this.language,
  ) : super();
}

class CheckPhoneNumberAccountExistsEvent extends MainBlocEvent {
  final String phoneNumber;

  CheckPhoneNumberAccountExistsEvent(this.phoneNumber);

  Map<String, dynamic> getVariables() => {
        'phoneNumberInput': {
          'phoneNumber': phoneNumber,
        },
      };

  String get query => r'''
query checkPhoneNumberAccountExists($phoneNumberInput: PhoneNumberAccountExistInput!){
  checkPhoneNumberAccountExists(input: $phoneNumberInput){
    ...on PhoneNumberAccountExistResult{
      __typename
      phoneNumberAccountExist
    }
  }
}        
    ''';

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
        'phoneNumber': phoneNumber,
      };
}
