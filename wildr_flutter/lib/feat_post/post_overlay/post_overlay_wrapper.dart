import 'dart:ui';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_type.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostOverlayWrapper extends StatelessWidget {
  final Widget child;
  final Post post;
  final double blurIntensity;
  final PostOverlayType overlay;
  final double? titleFontSize;
  final double? iconSize;
  final Color color;
  final bool isDense;
  final bool shouldShowWarningDescription;

  PostOverlayWrapper({
    super.key,
    required this.child,
    required this.post,
    this.blurIntensity = 20,
    this.titleFontSize,
    this.iconSize,
    this.color = WildrColors.gray300,
    this.isDense = false,
    this.shouldShowWarningDescription = true,
  }) : overlay = post.overlay;

  Widget _nsfwOverlay(BuildContext context) => Padding(
        padding: EdgeInsets.symmetric(horizontal: isDense ? 5 : 15),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            overlay.getWidget(size: iconSize, color: color),
            SizedBox(height: isDense ? 5 : 15),
            Text(
              overlay.getTitle(context),
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: titleFontSize ?? 25.0.sp,
                color: color,
              ),
            ),
            const SizedBox(height: 15),
            if (shouldShowWarningDescription)
              Text(
                overlay.getDescription(context),
                style: TextStyle(
                  fontSize: 15.0.sp,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
            const SizedBox(height: 15),
            if (!isDense)
              ElevatedButton(
                style: ButtonStyle(
                  shape: MaterialStateProperty.all<RoundedRectangleBorder>(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50),
                    ),
                  ),
                ),
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: Get.width * 0.1,
                    vertical: Get.height * 0.015,
                  ),
                  child: Text(
                    AppLocalizations.of(context)!.post_seeContent,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                onPressed: () => Common()
                    .mainBloc(context)
                    .add(UpdateSensitiveContentEvent(PostOverlayType.NONE)),
              ),
          ],
        ),
      );

  Widget _postToViewOverlay(BuildContext context) => Padding(
        padding: EdgeInsets.symmetric(horizontal: isDense ? 5 : 15),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            overlay.getWidget(
              size: iconSize,
              color: ChallengesStyles.of(context).primaryTextColor,
            ),
            SizedBox(height: isDense ? 5 : 15),
            if (isDense)
              GestureDetector(
                onTap: () => _navigateToCreatePostPage(context),
                child: Text(
                  overlay.getTitle(context),
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: titleFontSize ?? 25.0.sp,
                    color: ChallengesStyles.of(context).primaryTextColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              )
            else
              TextButton(
                onPressed: () => _navigateToCreatePostPage(context),
                style: TextButton.styleFrom(
                  foregroundColor: WildrColors.white,
                  backgroundColor: WildrColors.black.withOpacity(0.35),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 60,
                    vertical: 12,
                  ),
                ),
                child: Text(
                  AppLocalizations.of(context)!.post_postToView,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
          ],
        ),
      );

  void _navigateToCreatePostPage(BuildContext context) {
    if (post.parentChallenge?.hasJoined != true) {
      Common().showSnackBar(
        context,
        AppLocalizations.of(context)!.post_pleaseJoinTheChallengeFirst,
        action: post.parentChallenge?.id == null
            ? null
            : SnackBarAction(
                label: AppLocalizations.of(context)!.challenge_cap_join,
                onPressed: () {
                  context.pushRoute(
                    SingleChallengePageRoute(
                      challengeId: post.parentChallenge?.id ?? '',
                    ),
                  );
                },
              ),
      );
      return;
    }
    Common()
        .openCreatePostPage(context: context, challenge: post.parentChallenge);
  }

  Widget _overlayInteraction(BuildContext context) {
    if (overlay == PostOverlayType.NONE) return const SizedBox();
    final Widget child;
    switch (overlay) {
      case PostOverlayType.NSFW:
        child = _nsfwOverlay(context);
      case PostOverlayType.POST_TO_VIEW:
        child = _postToViewOverlay(context);
      case PostOverlayType.NONE:
        child = const SizedBox();
    }
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: blurIntensity,
          sigmaY: blurIntensity,
        ),
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Stack(
        fit: StackFit.expand,
        children: [
          child,
          _overlayInteraction(context),
        ],
      );
}
