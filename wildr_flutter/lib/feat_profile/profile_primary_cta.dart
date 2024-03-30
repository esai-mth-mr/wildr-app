import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ProfilePagePrimaryCTA extends StatelessWidget {
  final WildrUser user;
  final CurrentUserProfileGxC currentUserProfileGxC;
  final bool isPerformingAction;
  final VoidCallback performAction;

  const ProfilePagePrimaryCTA({
    super.key,
    required this.currentUserProfileGxC,
    required this.isPerformingAction,
    required this.performAction,
    required this.user,
  });

  ButtonStyle _elevatedButtonStyle() => ElevatedButton.styleFrom(
        backgroundColor: WildrColors.primaryColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22.0),
        ),
      );

  ElevatedButton _buildUnavailableUserButton(BuildContext context) =>
      ElevatedButton(
        onPressed: null,
        style: _elevatedButtonStyle(),
        child: Text(AppLocalizations.of(context)!.profile_userNotFound),
      );

  Widget _buildShimmerLoadingButton() => ProfilePageCommon().shimmer(
        shimmerChild: ElevatedButton(
          onPressed: null,
          child: null,
          style: _elevatedButtonStyle(),
        ),
      );

  Widget _buildLoadingCtaButton() => ElevatedButton(
        style: _elevatedButtonStyle(),
        onPressed: performAction,
        child: const Padding(
          padding: EdgeInsets.symmetric(vertical: 10),
          child: SizedBox(
            height: 25,
            width: 25,
            child: CircularProgressIndicator(
              backgroundColor: Colors.white,
              strokeWidth: 2,
            ),
          ),
        ),
      );

  Widget _buildUserBlockedButton(BuildContext context) => ElevatedButton(
        style: _elevatedButtonStyle(),
        onPressed: performAction,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: _textWidget(AppLocalizations.of(context)!.profile_cap_unblock),
        ),
      );

  Text _textWidget(String text) => Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: 17,
        ),
      );

  Widget _buildInnerCircleButton(BuildContext context) => ElevatedButton(
        style: _elevatedButtonStyle(),
        onPressed: performAction,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const WildrIconPng(WildrIconsPng.inner_circle, size: 20),
              const SizedBox(width: 10),
              _textWidget(AppLocalizations.of(context)!.feed_innerCircle),
              const SizedBox(width: 10),
              const WildrIcon(
                WildrIcons.chevron_down_outline,
                color: Colors.white,
              ),
            ],
          ),
        ),
      );

  Widget _buildFollowingButton(BuildContext context) => ElevatedButton(
        style: _elevatedButtonStyle(),
        onPressed: performAction,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _textWidget(AppLocalizations.of(context)!.feed_cap_following),
              const WildrIcon(
                WildrIcons.chevron_down_outline,
                color: Colors.white,
              ),
            ],
          ),
        ),
      );

  Widget _buildFollowButton(BuildContext context) => OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: WildrColors.primaryColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22.0),
          ),
        ),
        onPressed: performAction,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Text(
            AppLocalizations.of(context)!.profile_cap_follow,
            style: const TextStyle(
              color: WildrColors.primaryColor,
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
        ),
      );

  Widget _interactiveButton(BuildContext context) {
    if (user.isAvailable != null && !user.isAvailable!) {
      return _buildUnavailableUserButton(context);
    } else if (user.isEmpty() || user.isLoading) {
      return _buildShimmerLoadingButton();
    } else if (user.hasBlocked ?? false) {
      return _buildUserBlockedButton(context);
    } else if (isPerformingAction) {
      return _buildLoadingCtaButton();
    } else if (user.isInInnerCircle) {
      return _buildInnerCircleButton(context);
    } else {
      return user.currentUserContext?.isFollowing ?? false
          ? _buildFollowingButton(context)
          : _buildFollowButton(context);
    }
  }

  @override
  Widget build(BuildContext context) => SizedBox(
        width: Get.width * 0.85,
        height: 46,
        child: _interactiveButton(context),
      );
}
