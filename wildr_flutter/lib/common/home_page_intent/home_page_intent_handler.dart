// ignore_for_file: unused_import

import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class HomePageIntentHandler {
  Future<void> handleHomePageIntent(
    HomePageIntent intent,
    MainBloc mainBloc,
    StackRouter appRouter,
  ) async {
    debugPrint(
      '[handleHomePageIntent]  type:'
      ' ${intent.type.name} :${intent.objectId}',
    );
    final ObjectId? objectId = intent.objectId;
    switch (intent.type) {
      case HomePageIntentType.UNDEFINED:
        return;
      case HomePageIntentType.LOGIN:
        await Common().openLoginPage(appRouter);
      case HomePageIntentType.SIGNUP:
        await Common().openLoginPage(appRouter, isSignup: true);
      case HomePageIntentType.SINGLE_CHALLENGE:
        if (objectId == null) return;
        final bool hasCompletedChallengeOnboarding =
            mainBloc.currentUser.onboardingStats.challenges;
        final challengeId = objectId.challengeId;
        if (challengeId == null) {
          debugPrint('challengeId is null');
          return;
        }
        await appRouter.pushAll(
          [
            SingleChallengePageRoute(
              challengeId: challengeId,
            ),
            if (!hasCompletedChallengeOnboarding)
              ChallengesOnboardingPageRoute(
                isEntryPoint: false,
                isChallengeEducation: true,
                skipLoginFlow: true,
              ),
          ],
        ).then((value) => Prefs.remove(PrefKeys.kChallengeIdForOnboarding));

      case HomePageIntentType.POST:
        if (objectId == null) return;
        final postId = objectId.postId;
        if (postId == null) {
          debugPrint('postId is null');
          return;
        }
        await appRouter.push(SinglePostPageRoute(postId: postId));
      case HomePageIntentType.COMMENT:
      case HomePageIntentType.REPLY:
        if (objectId == null) return;
        // comment navigation checks necessary checks for reply navigation
        // worse case scenario: the user will be navigated to the comment
        // instead of the reply
        if (objectId.isValidForCommentNavigation()) {
          if (objectId.challengeId != null) {
            await appRouter.push(
              SingleChallengePageRoute(
                challengeId: objectId.challengeId!,
                commentToNavigateToId: objectId.commentId,
                replyToNavigateToId: objectId.replyId,
              ),
            );
          } else {
            await appRouter.push(
              SinglePostPageRoute(
                postId: objectId.postId!,
                commentToNavigateToId: objectId.commentId,
                replyToNavigateToId: objectId.replyId,
              ),
            );
          }
        }
      case HomePageIntentType.USER:
        if (objectId == null) return;
        final userId = objectId.userId;
        if (userId == null) {
          debugPrint('userId is null');
          return;
        }
        await appRouter.push(ProfilePageRoute(idOfUserToFetch: userId));
      case HomePageIntentType.REDEEM_INVITE_CODE:
      case HomePageIntentType.REDEEM_INVITE_CODE_WITH_ACTION:
        debugPrint('REDEEM INVITE CODE');
        final loggedIn = mainBloc.isLoggedIn;
        final int? code = int.tryParse(objectId?.inviteCode ?? '0');
        if (code != null) {
          debugPrint('CODE = $code');
          if (loggedIn) {
            mainBloc.add(CheckInviteCodeEvent(code));
          } else {
            if (intent.type ==
                HomePageIntentType.REDEEM_INVITE_CODE_WITH_ACTION) {
              await Prefs.setString(
                PrefKeys.kDynamicLinkHasInviteCodeAction,
                'true',
              );
            }
            await Prefs.setInt(PrefKeys.kReferralOrInviteCode, code);
          }
        }
        if (intent.nextIntent != null) {
          debugPrint('second intent not null');
          unawaited(
            handleHomePageIntent(
              intent.nextIntent!,
              mainBloc,
              appRouter,
            ),
          );
        }
      case HomePageIntentType.NOTIFICATIONS_PAGE:
        await appRouter.push(const NotificationsPageRoute());
    }
  }
}
