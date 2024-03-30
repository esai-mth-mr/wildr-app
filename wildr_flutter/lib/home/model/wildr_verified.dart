// ignore_for_file: no_default_cases

import 'dart:typed_data';

enum WildrVerifiedHandGesture {
  PEACE,
  THUMBS_UP,
  THUMBS_DOWN,
  CROSSED_FINGERS,
  FIST,
  HORN_FINGERS,
  RAISED_HAND,
  HANG_LOOSE,
  POINT_FINGER
}

final List<WildrVerifiedHandGesture> allHandGestures = [
  WildrVerifiedHandGesture.PEACE,
  WildrVerifiedHandGesture.THUMBS_UP,
  WildrVerifiedHandGesture.THUMBS_DOWN,
  WildrVerifiedHandGesture.CROSSED_FINGERS,
  WildrVerifiedHandGesture.FIST,
  WildrVerifiedHandGesture.HORN_FINGERS,
  WildrVerifiedHandGesture.RAISED_HAND,
  WildrVerifiedHandGesture.HANG_LOOSE,
  WildrVerifiedHandGesture.POINT_FINGER,
];

enum WildrVerifiedStatus {
  UNVERIFIED,
  PENDING_REVIEW,
  REVIEW_REJECTED,
  VERIFIED
}

extension ParseWildrVerifiedStatus on WildrVerifiedStatus {
  String toBannerTitleString() {
    switch (this) {
      case WildrVerifiedStatus.UNVERIFIED:
        return "Let's keep Wildr a safe community.";
      case WildrVerifiedStatus.PENDING_REVIEW:
        return 'Please wait while we verify you';
      case WildrVerifiedStatus.REVIEW_REJECTED:
        return 'Your Wildr Verified review was rejected';
      case WildrVerifiedStatus.VERIFIED:
        return '';
    }
  }

  String toBannerSubTitle() {
    switch (this) {
      case WildrVerifiedStatus.UNVERIFIED:
        return 'Verify yourself to start commenting';
      case WildrVerifiedStatus.REVIEW_REJECTED:
        return 'Please verify again.';
      default:
        return '';
    }
  }
}

class WildrVerifiedFailedVerificationImageData {
  bool isSmiling;
  Uint8List? image;
  WildrVerifiedHandGesture wildrVerifiedHandGesture;

  WildrVerifiedFailedVerificationImageData({
    required this.isSmiling,
    required this.image,
    required this.wildrVerifiedHandGesture,
  });

  String getInstructionString() => isSmiling
      ? 'Smile and show ${wildrVerifiedHandGesture.toViewString()} '
          'sign with your hands.'
      : 'Without smiling show ${wildrVerifiedHandGesture.toViewString()} '
          'sign with your hands.';
}

extension WildrVerifiedHandGestureParse on WildrVerifiedHandGesture {
  String toViewString() {
    switch (this) {
      case WildrVerifiedHandGesture.PEACE:
        return 'Peace ${toEmoji()}️';
      case WildrVerifiedHandGesture.THUMBS_UP:
        return 'Thumbs up ${toEmoji()}️';
      case WildrVerifiedHandGesture.THUMBS_DOWN:
        return 'Thumbs down ${toEmoji()}️';
      case WildrVerifiedHandGesture.CROSSED_FINGERS:
        return 'Crossed Fingers ${toEmoji()}️';
      case WildrVerifiedHandGesture.FIST:
        return 'Fist ${toEmoji()}️';
      case WildrVerifiedHandGesture.HORN_FINGERS:
        return 'Horned Fingers ${toEmoji()}️';
      case WildrVerifiedHandGesture.RAISED_HAND:
        return 'Raise Hand ${toEmoji()}️';
      case WildrVerifiedHandGesture.HANG_LOOSE:
        return 'Hang loose ${toEmoji()}️';
      case WildrVerifiedHandGesture.POINT_FINGER:
        return 'Point Finger ${toEmoji()}️';
    }
  }

  String toEmoji() {
    switch (this) {
      case WildrVerifiedHandGesture.PEACE:
        return '✌️';
      case WildrVerifiedHandGesture.THUMBS_UP:
        return '👍';
      case WildrVerifiedHandGesture.THUMBS_DOWN:
        return '👎';
      case WildrVerifiedHandGesture.CROSSED_FINGERS:
        return '🤞';
      case WildrVerifiedHandGesture.FIST:
        return '👊';
      case WildrVerifiedHandGesture.HORN_FINGERS:
        return '🤟';
      case WildrVerifiedHandGesture.RAISED_HAND:
        return '✋';
      case WildrVerifiedHandGesture.HANG_LOOSE:
        return '🤙';
      case WildrVerifiedHandGesture.POINT_FINGER:
        return '☝️';
    }
  }

  String getSmilingFullImage() {
    const String baseUrl = 'assets/wildr_verified/manual_review/smiling/';
    switch (this) {
      case WildrVerifiedHandGesture.PEACE:
        return '${baseUrl}peace.svg';
      case WildrVerifiedHandGesture.THUMBS_UP:
        return '${baseUrl}thumbs_up.svg';
      case WildrVerifiedHandGesture.THUMBS_DOWN:
        return '${baseUrl}thumbs_down.svg';
      case WildrVerifiedHandGesture.CROSSED_FINGERS:
        return '${baseUrl}crossed_fingers.svg';
      case WildrVerifiedHandGesture.FIST:
        return '${baseUrl}fist.svg';
      case WildrVerifiedHandGesture.HORN_FINGERS:
        return '${baseUrl}horn_fingers.svg';
      case WildrVerifiedHandGesture.RAISED_HAND:
        return '${baseUrl}raised_hand.svg';
      case WildrVerifiedHandGesture.HANG_LOOSE:
        return '${baseUrl}hang_loose.svg';
      case WildrVerifiedHandGesture.POINT_FINGER:
        return '${baseUrl}point_finger.svg';
    }
  }

  String getNotSmilingFullImage() {
    const String baseUrl = 'assets/wildr_verified/manual_review/not_smiling/';
    switch (this) {
      case WildrVerifiedHandGesture.PEACE:
        return '${baseUrl}peace.svg';
      case WildrVerifiedHandGesture.THUMBS_UP:
        return '${baseUrl}thumbs_up.svg';
      case WildrVerifiedHandGesture.THUMBS_DOWN:
        return '${baseUrl}thumbs_down.svg';
      case WildrVerifiedHandGesture.CROSSED_FINGERS:
        return '${baseUrl}crossed_fingers.svg';
      case WildrVerifiedHandGesture.FIST:
        return '${baseUrl}fist.svg';
      case WildrVerifiedHandGesture.HORN_FINGERS:
        return '${baseUrl}horn_fingers.svg';
      case WildrVerifiedHandGesture.RAISED_HAND:
        return '${baseUrl}raised_hand.svg';
      case WildrVerifiedHandGesture.HANG_LOOSE:
        return '${baseUrl}hang_loose.svg';
      case WildrVerifiedHandGesture.POINT_FINGER:
        return '${baseUrl}point_finger.svg';
    }
  }
}
