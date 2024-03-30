import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';

void print(dynamic message) {
  debugPrint('FDLIntentService: $message');
}

class FDLIntentService {
  HomePageIntent? prepareIntent(PendingDynamicLinkData data) {
    print(data.toString());
    return _prepareIntentFromPathSegments(data.link);
  }

  HomePageIntent? _prepareIntentFromPathSegments(Uri deepLink) {
    if (deepLink.pathSegments.isEmpty) return null;
    HomePageIntent? intent;
    print('FIRST PATH SEGMENT = ${deepLink.pathSegments.first}');
    intent = _handleInvitePathSegment(deepLink);
    intent ??= _handlePostPathSegment(deepLink);
    intent ??= _handleChallengePathSegment(deepLink);
    print('intent isNull? ${intent == null} ${intent?.type}');
    return intent;
  }

  HomePageIntent? _handleInvitePathSegment(Uri deepLink) {
    if (deepLink.pathSegments.first != FDLPathSegments.invite) return null;
    final String? code = deepLink.queryParameters[FDLParams.code];
    if (code == null) return null;
    final String? action = deepLink.queryParameters[FDLParams.inviteCodeAction];
    if (action == null) {
      return HomePageIntent(
        HomePageIntentType.REDEEM_INVITE_CODE,
        ObjectId.inviteCode(code),
      );
    }
    return HomePageIntent(
      HomePageIntentType.REDEEM_INVITE_CODE_WITH_ACTION,
      ObjectId.inviteCode(code),
    );
  }

  HomePageIntent? _handlePostPathSegment(Uri deepLink) {
    if (deepLink.pathSegments.first !=
        FlavorConfig.getValue(kDynamicLinkFirstSharePostPathSegment)) {
      return null;
    }
    final String? postId = _getObjectId(deepLink.queryParameters);
    print('_handlePostPathSegment -> id = $postId');
    return HomePageIntent(HomePageIntentType.POST, ObjectId.post(postId));
  }

  HomePageIntent? _handleChallengePathSegment(Uri deepLink) {
    if (deepLink.pathSegments.first != FDLPathSegments.challenge) return null;
    final String? challengeId = _getObjectId(deepLink.queryParameters);
    if (challengeId == null || challengeId.isEmpty) return null;
    print('_handleChallengePathSegment -> id = $challengeId');
    return HomePageIntent(
      HomePageIntentType.SINGLE_CHALLENGE,
      ObjectId.challenge(challengeId),
    );
  }

  String? _getObjectId(Map<String, String> queryParameters) =>
      queryParameters[FDLParams.deprecated_objectId] ??
      queryParameters[FDLParams.objectId];
}
