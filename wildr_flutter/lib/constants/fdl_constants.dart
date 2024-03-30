class FDLConstants {
  static const String termsOfService = '/legal/terms-of-service';
  static const String privacyPolicySuffix = '/legal/privacy-policy';
  static const String communityGuidelineSuffix = '/legal/community-guidelines';
}

class FDLParams {
  static const String referral = 'referral';
  static const String referralName = 'name';
  static const String referralHandle = 'r_handle';
  static const String referralId = 'r_id';
  static const String source = 's';
  static const String inviteCodeAction = 'action';
  static const String code = 'code';
  static const String deprecated_objectId = 'id'; // use objectId instead
  static const String objectId = 'o_id';
}

class FDLParamValues {
  static const String linkSourceChallenge = 'challenge_link';
  static const String linkSourceReferral = 'referral';
  static const String linkSourcePost = 'post_link';
  static const String linkSourceChallengePost = 'challenge_post_link';
}

class FDLPathSegments {
  static const String challenge = 'challenges';
  static const String post = 'post';
  static const String invite = 'invite';
}