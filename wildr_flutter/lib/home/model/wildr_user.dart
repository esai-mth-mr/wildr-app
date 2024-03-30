import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/visibility_preferences.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/onboarding_stats.dart';
import 'package:wildr_flutter/home/model/timestamp.dart';
import 'package:wildr_flutter/home/model/wildr_verified.dart';

void print(dynamic message) {
  debugPrint('UserPOJO: $message');
}

class WildrUser {
  bool isCurrentUser = false;
  late String id = '';
  late final TimeStamp ts;
  late final String handle;
  String? name;
  String? email;
  String? phoneNumber;
  AvatarImage? avatarImage;
  AvatarImage? wildrVerifiedFace;
  String? _wildrVerifiedVerificationStatus;
  UserStats userStats = UserStats();
  StrikeData strikeData = StrikeData();
  CurrentUserContext? currentUserContext;
  bool? isAvailable;
  bool? hasBlocked = false;
  DateTime? commentEnabledAt;
  DateTime? commentOnboardedAt;
  DateTime? userCreatedAt;
  bool? isSuspended;
  double? score;
  int? embargoExpirationDaysDelta;
  int? remainingInvitesCount;
  String? pronoun;
  String? bio;
  bool? hasCompletedContentPreferencesOnboarding;
  OnboardingStats onboardingStats = OnboardingStats();
  VisibilityPreferences? visibilityPreferences;

  //List<Post>? posts;
  String? endCursor; //For posts list;

  bool getIsSuspended() => isSuspended ?? false;

  bool get isInInnerCircle => currentUserContext?.isInnerCircle ?? false;

  WildrUser copy(WildrUser user) {
    user.endCursor = endCursor;
    print('During copy, EndCursor ${user.endCursor}');
    return user;
  }

  WildrUser.empty([WildrUser? user]) {
    isCurrentUser = false;
    id = user == null ? '' : kLoading;
    ts = TimeStamp();
    handle = user?.handle ?? '---';
    name = user?.name;
    score = user?.score;
    avatarImage = user?.avatarImage ?? AvatarImage.empty();
    wildrVerifiedFace = AvatarImage.empty();
    pronoun = '';
    bio = '';
  }

  bool isEmpty() => id == '';

  bool get isLoading => id == kLoading;

  Map<String, dynamic> toJson() => {
        'isCurrentUser': isCurrentUser,
        'id': id,
        'ts': ts.toJson(),
        'handle': handle,
        'name': name,
        'email': email,
        'phone': phoneNumber,
        'commentEnabledAt': commentEnabledAt?.toIso8601String(),
        'commentOnboardedAt': commentOnboardedAt?.toIso8601String(),
        'userCreatedAt': userCreatedAt?.toIso8601String(),
        'avatarImage': avatarImage?.toJson(),
        'realIdFace': wildrVerifiedFace?.toJson(),
        'realIdVerificationStatus': _wildrVerifiedVerificationStatus,
        'stats': userStats.toJson(),
        'remainingInvitesCount': remainingInvitesCount,
        'bio': bio ?? '',
        'pronoun': pronoun ?? '',
        'hasPersonalizedFeed': hasCompletedContentPreferencesOnboarding ?? true,
        'onboardingStats': onboardingStats.toJson(),
      };

  WildrUser.fromJson(Map<String, dynamic> json) {
    // print("From JSON");
    isCurrentUser = json['isCurrentUser'] ?? true;
    id = json['id'] ?? '-';
    ts = TimeStamp.fromJson(json['ts']);
    handle = json['handle'] ?? '--';
    name = json['name'];
    email = json['email'];
    phoneNumber = json['phoneNumber'];
    avatarImage = AvatarImage.fromJson(json['avatarImage']);
    wildrVerifiedFace = AvatarImage.fromJson(json['realIdFace']);
    userStats = UserStats.fromJson(json['stats']);
    isAvailable = json['isAvailable'];
    isSuspended = json['isSuspended'];
    score = double.tryParse(json['score'].toString()) ?? 0.0;
    hasBlocked = json['hasBlocked'];
    commentEnabledAt = json['commentEnabledAt'] != null
        ? DateTime.parse(json['commentEnabledAt'])
        : null;
    commentOnboardedAt = json['commentOnboardedAt'] != null
        ? DateTime.parse(json['commentOnboardedAt'])
        : null;
    remainingInvitesCount = json['remainingInvitesCount'];
    userCreatedAt = json['userCreatedAt'] != null
        ? DateTime.parse(json['userCreatedAt'])
        : null;
    remainingInvitesCount = json['remainingInvitesCount'];
    if (json['currentUserContext'] != null) {
      currentUserContext =
          CurrentUserContext.fromJson(json['currentUserContext']);
    }
    _wildrVerifiedVerificationStatus = json['realIdVerificationStatus'];
    bio = json['bio'] ?? '';
    pronoun = json['pronoun'] ?? '';
    hasCompletedContentPreferencesOnboarding = json['hasPersonalizedFeed'];
    visibilityPreferences =
        VisibilityPreferences.fromJson(json['visibilityPreferences']);
    onboardingStats = OnboardingStats.fromJson(json['onboardingStats']);
  }

  WildrUser.fromData(Map<String, dynamic> data, {this.isCurrentUser = false}) {
    final Map<String, dynamic>? user = data['getUser']['user'];
    if (user == null) {
      return;
    }
    id = user['id'];
    ts = TimeStamp.fromJson(user['ts']);
    handle = user['handle'];
    name = user['name'];
    email = user['email'];
    phoneNumber = user['phoneNumber'];
    avatarImage = AvatarImage.fromJson(user['avatarImage']);
    wildrVerifiedFace = AvatarImage.fromJson(user['realIdFace']);
    _wildrVerifiedVerificationStatus = user['realIdVerificationStatus'];
    userStats = UserStats.fromJson(user['stats']);
    strikeData = StrikeData.fromJSON(user['strikeData']);
    isAvailable = user['isAvailable'];
    isSuspended = user['isSuspended'];
    score = user['score']?.toDouble();
    hasBlocked = user['hasBlocked'];
    commentEnabledAt = user['commentEnabledAt'] != null
        ? DateTime.parse(user['commentEnabledAt'])
        : null;
    commentOnboardedAt = user['commentOnboardedAt'] != null
        ? DateTime.parse(user['commentOnboardedAt'])
        : null;
    embargoExpirationDaysDelta = user['embargoExpirationDaysDelta'];
    userCreatedAt = user['userCreatedAt'] != null
        ? DateTime.parse(user['userCreatedAt'])
        : null;
    remainingInvitesCount = user['remainingInvitesCount'];
    if (user['currentUserContext'] != null) {
      debugPrint(user['currentUserContext'].toString());
      currentUserContext =
          CurrentUserContext.fromJson(user['currentUserContext']);
    }
    hasCompletedContentPreferencesOnboarding = user['hasPersonalizedFeed'];
    pronoun = user['pronoun'] ?? '';
    bio = user['bio'] ?? '';
    onboardingStats = OnboardingStats.fromJson(user['onboardingStats']);
    visibilityPreferences =
        VisibilityPreferences.fromJson(user['visibilityPreferences']);
  }

  WildrUser.fromAuthor(Author author) {
    id = author.id;
    handle = author.handle;
    name = author.name;
    avatarImage = author.avatarImage;
    score = author.score;
  }

  //From login or signup
  WildrUser.fromUserObj(
    Map<String, dynamic>? user, {
    this.isCurrentUser = false,
  }) {
    if (user == null) {
      return;
    }
    id = user['id'];
    ts = TimeStamp.fromJson(user['ts']);
    handle = user['handle'];
    name = user['name'];
    email = user['email'];
    phoneNumber = user['phoneNumber'];
    avatarImage = AvatarImage.fromJson(user['avatarImage']);
    wildrVerifiedFace = AvatarImage.fromJson(user['realIdFace']);
    _wildrVerifiedVerificationStatus = user['realIdVerificationStatus'];
    userStats = UserStats.fromJson(user['stats']);
    isAvailable = user['isAvailable'];
    isSuspended = user['isSuspended'];
    score = double.tryParse(user['score'].toString());
    hasBlocked = user['hasBlocked'];
    remainingInvitesCount = user['remainingInvitesCount'];
    commentEnabledAt = user['commentEnabledAt'] != null
        ? DateTime.parse(user['commentEnabledAt'])
        : null;
    commentOnboardedAt = user['commentOnboardedAt'] != null
        ? DateTime.parse(user['commentOnboardedAt'])
        : null;
    userCreatedAt = user['userCreatedAt'] != null
        ? DateTime.parse(user['userCreatedAt'])
        : null;
    if (user['currentUserContext'] != null) {
      currentUserContext =
          CurrentUserContext.fromJson(user['currentUserContext']);
    }
    pronoun = user['pronoun'] ?? '';
    bio = user['bio'] ?? '';
    hasCompletedContentPreferencesOnboarding = user['hasPersonalizedFeed'];
    visibilityPreferences =
        VisibilityPreferences.fromJson(user['visibilityPreferences']);
  }

  WildrUser.forActivity(Map<String, dynamic> node) {
    id = node['id'] ?? '';
    avatarImage = AvatarImage.fromJson(node['avatarImage']);
    wildrVerifiedFace = AvatarImage.fromJson(node['realIdFace']);
    _wildrVerifiedVerificationStatus = node['realIdVerificationStatus'];
    handle = node['handle'] ?? '';
    isAvailable = node['isAvailable'];
    isSuspended = node['isSuspended'];
    score = node['score']?.toDouble();
    hasBlocked = node['hasBlocked'];
    remainingInvitesCount = node['remainingInvitesCount'];
    userCreatedAt = node['userCreatedAt'] != null
        ? DateTime.parse(node['userCreatedAt'])
        : null;
    pronoun = node['pronoun'] ?? '';
    bio = node['bio'] ?? '';
    hasCompletedContentPreferencesOnboarding = node['hasPersonalizedFeed'];
    visibilityPreferences =
        VisibilityPreferences.fromJson(node['visibilityPreferences']);
  }

  WildrVerifiedStatus get wildrVerifiedVerificationStatus =>
      toWildrVerifiedVerificationStatus(_wildrVerifiedVerificationStatus ?? '');

  set wildrVerifiedVerificationStatus(WildrVerifiedStatus status) =>
      _wildrVerifiedVerificationStatus = status.name;

  bool get shouldShowWildrVerifyBanner =>
      wildrVerifiedVerificationStatus == WildrVerifiedStatus.REVIEW_REJECTED ||
      wildrVerifiedVerificationStatus == WildrVerifiedStatus.UNVERIFIED;

  WildrVerifiedStatus toWildrVerifiedVerificationStatus(String input) {
    switch (input) {
      case 'PENDING_REVIEW':
        return WildrVerifiedStatus.PENDING_REVIEW;
      case 'REVIEW_REJECTED':
        return WildrVerifiedStatus.REVIEW_REJECTED;
      case 'VERIFIED':
        return WildrVerifiedStatus.VERIFIED;
      default:
        return WildrVerifiedStatus.UNVERIFIED;
    }
  }

  @override
  String toString() => '''
    WildrUser {
      isCurrentUser: $isCurrentUser,
      id: $id,
      handle: $handle,
      name: $name,
      email: $email,
      phoneNumber: $phoneNumber,
      avatarImage: $avatarImage,
      realIdFace: $wildrVerifiedFace,
      realIdVerificationStatus: $_wildrVerifiedVerificationStatus,
      userStats: $userStats,
      strikeData: $strikeData,
      currentUserContext: $currentUserContext,
      stats: $userStats
      visibility: $visibilityPreferences
      onboardingStats: $onboardingStats
    }
    ''';
}

class UserStats {
  int followingCount = 0;
  int followerCount = 0;
  int postCount = 0;
  int innerCircleCount = 0;
  String followingCountFormatted = '';
  String followerCountFormatted = '';
  String postCountFormatted = '';
  String innerCircleCountFormatted = '';

  UserStats();

  Map<String, dynamic> toJson() => {
        'followingCount': followingCount,
        'followerCount': followerCount,
        'postCount': postCount,
        'innerCircleCount': innerCircleCount,
      };

  @override
  String toString() => toJson().toString();

  String _getFormattedCount(int count) {
    if (count < 10000) {
      return NumberFormat('#,###').format(count);
    }
    return NumberFormat.compact().format(count);
  }

  UserStats.fromJson(Map<String, dynamic>? map) {
    if (map == null) {
      return;
    }
    followingCount = map['followingCount'] ?? 0;
    followingCountFormatted = _getFormattedCount(followingCount);
    followerCount = map['followerCount'] ?? 0;
    followerCountFormatted = _getFormattedCount(followerCount);
    postCount = map['postCount'] ?? 0;
    postCountFormatted = _getFormattedCount(postCount);
    innerCircleCount = map['innerCircleCount'] ?? 0;
    innerCircleCountFormatted = _getFormattedCount(innerCircleCount);
  }
}

class StrikeData {
  bool isFaded = false;
  int currentStrikeCount = 0;

  int firstStrikeCount = 0;
  DateTime? firstStrikeTS;
  DateTime? firstStrikeExpiryTS;

  int secondStrikeCount = 0;
  DateTime? secondStrikeTS;
  DateTime? secondStrikeExpiryTS;

  int thirdStrikeCount = 0;
  DateTime? thirdStrikeTS;
  DateTime? thirdStrikeExpiryTS;

  int fadeStrikeCount = 0;
  List<DateTime>? fadeStrikeTimeStamps;

  StrikeData();

  Map<String, dynamic> toJson() => {
        'isFaded': isFaded,
        'currentStrikeCount': currentStrikeCount,
      };

  StrikeData.fromJSON(Map<String, dynamic> map) {
    isFaded = map['isFaded'] ?? false;
    currentStrikeCount = map['currentStrikeCount'] ?? 0;

    /// FIRST STRIKE
    firstStrikeCount = map['firstStrikeCount'] ?? 0;
    final String? firstStrikeTS = map['firstStrikeTS'];
    if (firstStrikeTS != null) {
      this.firstStrikeTS = DateTime.parse(firstStrikeTS);
    }
    final String? firstStrikeExpiryTS = map['firstStrikeExpiryTS'];
    if (firstStrikeExpiryTS != null) {
      this.firstStrikeExpiryTS = DateTime.parse(firstStrikeExpiryTS);
    }

    /// SECOND STRIKE
    secondStrikeCount = map['secondStrikeCount'] ?? 0;
    final String? secondStrikeTS = map['secondStrikeTS'];
    if (secondStrikeTS != null) {
      this.secondStrikeTS = DateTime.parse(secondStrikeTS);
    }
    final String? secondStrikeExpiryTS = map['secondStrikeExpiryTS'];
    if (secondStrikeExpiryTS != null) {
      this.secondStrikeExpiryTS = DateTime.parse(secondStrikeExpiryTS);
    }

    /// THIRD STRIKE
    thirdStrikeCount = map['thirdStrikeCount'] ?? 0;
    final String? thirdStrikeTS = map['thirdStrikeTS'];
    if (thirdStrikeTS != null) {
      this.thirdStrikeTS = DateTime.parse(thirdStrikeTS);
    }
    final String? thirdStrikeExpiryTS = map['thirdStrikeExpiryTS'];
    if (thirdStrikeExpiryTS != null) {
      this.thirdStrikeExpiryTS = DateTime.parse(thirdStrikeExpiryTS);
    }

    /// FADE
    fadeStrikeCount = map['fadeStrikeCount'] ?? 0;
    // List<DateTime>? fadeStrikeTimeStamps;
  }
}

class CurrentUserContext {
  bool isFollowing = false;
  bool? isInnerCircle;

  CurrentUserContext();

  CurrentUserContext.fromValues({
    this.isFollowing = false,
    this.isInnerCircle,
  });

  CurrentUserContext.fromJson(Map<String, dynamic>? map) {
    if (map == null) {
      return;
    }
    isFollowing = map['followingUser'];
    isInnerCircle = map['isInnerCircle'] ?? isInnerCircle;
  }

  @override
  String toString() => '{isFollowing: $isFollowing,'
      ' isInnerCircle: $isInnerCircle}';
}
