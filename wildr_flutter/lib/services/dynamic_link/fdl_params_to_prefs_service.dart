import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

void print(dynamic message) {
  debugPrint('FDLParamsToPrefsService: $message');
}

class FDLParamsToPrefsService {
  void handleParams(Uri deepLink) {
    deepLink.queryParameters.forEach((key, value) {
      print('queryParameter key: [$key] value: [$value]');
      switch (key) {
        case FDLParams.referral:
          handleReferralCode(value);
        case FDLParams.referralName:
          handleReferralName(value);
        case FDLParams.referralHandle:
          handleReferrerHandle(value);
        case FDLParams.referralId:
          handleReferrerId(value);
        case FDLParams.source:
          handleSource(value);
        case FDLParams.code:
          handleReferralCode(value);
        case FDLParams.deprecated_objectId:
        case FDLParams.objectId:
          _saveObjectId(value, deepLink);
      }
    });
  }

  void handleReferralCode(String referralValue) {
    final int? referralCode = int.tryParse(referralValue);
    if (referralCode == null) return;
    Prefs.setInt(PrefKeys.kReferralOrInviteCode, referralCode);
  }

  void handleReferralName(String referralName) {
    Prefs.setString(PrefKeys.kReferralName, referralName);
  }

  void handleReferrerHandle(String referrerHandle) {
    Prefs.setString(PrefKeys.kReferrerHandle, referrerHandle);
  }

  void handleReferrerId(String referrerId) {
    Prefs.setString(PrefKeys.kReferrerId, referrerId);
  }

  void handleSource(String source) {
    Prefs.setString(PrefKeys.kFDLSource, source);
  }

  void _saveObjectId(String objectId, Uri deepLink) {
    switch (deepLink.pathSegments.first) {
      case FDLPathSegments.challenge:
        _saveChallengeIdToPrefsForReferral(objectId);
    }
  }

  void _saveChallengeIdToPrefsForReferral(String challengeId) {
    Prefs.setString(PrefKeys.kChallengeIdForSignupReferralParams, challengeId);
    Prefs.setString(PrefKeys.kChallengeIdForOnboarding, challengeId);
  }
}
