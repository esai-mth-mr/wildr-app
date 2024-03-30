import 'dart:io';

import 'package:align_positioned/align_positioned.dart';
import 'package:auto_route/auto_route.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:readmore/readmore.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/popups/profile_page_popups.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('PPC: $message');
}

class ProfilePageCommon {
  static final ProfilePageCommon _instance = ProfilePageCommon._internal();

  factory ProfilePageCommon() => _instance;

  ProfilePageCommon._internal();

  Widget handle(WildrUser user) {
    String suspendedText = '';
    if (user.isSuspended ?? false) {
      suspendedText = '\n(Suspended)';
    }
    return (user.isEmpty())
        ? shimmer(isLoadingText: true)
        : Text(
            '@${user.handle}$suspendedText',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
          );
  }

  Widget shimmer({
    Widget? shimmerChild,
    bool isLoadingText = false,
    double fontSize = 25,
  }) =>
      Common().wrapInShimmer(
        isLoadingText
            ? Text('--------------', style: TextStyle(fontSize: fontSize))
            : shimmerChild ?? Container(),
      );

  Widget backButton(BuildContext context) => Align(
        alignment: Alignment.centerLeft,
        child: IconButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          icon: const WildrIcon(WildrIcons.chevron_left_filled),
          padding: EdgeInsets.zero,
        ),
      );

  Widget updatedProfileImage(String path) => CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        radius: 50,
        backgroundImage: FileImage(File(path)),
      );

  List<Color> ringColorGradient(int strikeCount) {
    switch (strikeCount) {
      case 0:
        return [
          WildrColors.primaryColor,
          WildrColors.primaryColor,
        ];
      case 1:
        return [
          Colors.orange,
          Colors.orange,
        ];
      default:
        return [
          Colors.red,
          Colors.red,
        ];
    }
  }

  Color ringColor(double? score, int? strikeCount) {
    if (score != null) {
      if (score <= 2) {
        return WildrColors.errorColor;
      } else if (score <= 4) {
        return WildrColors.yellow;
      } else {
        return WildrColors.primaryColor;
      }
    }
    switch (strikeCount) {
      case 0:
        return WildrColors.primaryColor;
      case 1:
        return WildrColors.yellow;
      default:
        return WildrColors.errorColor;
    }
  }

  Widget profileImageCircleAvatarWithWildrVerified(
    AvatarImage? avatarImage,
    String? handle,
  ) =>
      CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        radius: 50,
        backgroundImage: Common().getImageProvider(avatarImage),
        child: (avatarImage == null)
            ? ProfilePageCommon().shimmer(
                shimmerChild: const CircleAvatar(
                  backgroundColor: Colors.white,
                  radius: 50,
                ),
              )
            : (avatarImage.url == null)
                ? Text(
                    handle?.substring(0, 2).toUpperCase() ?? '',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 30,
                    ),
                  )
                : null,
      );

  Widget profileImageCircleAvatar(WildrUser? user) => CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        radius: 50,
        backgroundImage: Common().getImageProvider(user?.avatarImage),
        child: (user == null)
            ? ProfilePageCommon().shimmer(
                shimmerChild: const CircleAvatar(
                  backgroundColor: Colors.white,
                  radius: 50,
                ),
              )
            : (user.avatarImage?.url == null)
                ? Text(
                    user.handle.substring(0, 2).toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 30,
                    ),
                  )
                : null,
      );

  Widget userName(WildrUser user) => user.isEmpty()
      ? shimmer(isLoadingText: true, fontSize: 20)
      : user.name != null
          ? user.name != ''
              ? Flexible(
                  child: Text(
                    user.name!,
                    style: const TextStyle(fontSize: 18),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                )
              : Container()
          : Container();

  Widget pronoun(WildrUser user) => user.isEmpty()
      ? shimmer(isLoadingText: true, fontSize: 20)
      : user.pronoun != null
          ? user.pronoun != ''
              ? Text(
                  user.pronoun!,
                  style: const TextStyle(fontSize: 18, color: Colors.grey),
                )
              : Container()
          : Container();

  Widget bio(WildrUser user) => SizedBox(
        width: Get.width * 0.9,
        child: user.isLoading
            ? shimmer(
                shimmerChild: const Center(
                  child: Text('--------------', style: TextStyle(fontSize: 16)),
                ),
              )
            : user.bio != null
                ? user.bio == ''
                    ? Container()
                    : ReadMoreText(
                        user.bio!,
                        trimMode: TrimMode.Line,
                        trimCollapsedText: ' See More',
                        trimExpandedText: '',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                        lessStyle: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                        moreStyle: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: WildrColors.primaryColor,
                        ),
                      )
                : Container(),
      );

  Widget _innerCircleOrPostCount(
    double width,
    WildrUser user,
    bool isCurrentUser,
    bool isUserLoggedIn,
    BuildContext context,
  ) {
    final String bottomText = isCurrentUser
        ? AppLocalizations.of(context)!.feed_innerCircle
        : AppLocalizations.of(context)!.profile_cap_posts;
    return InkWell(
      onTap: () {
        if ((!user.isLoading || user.id.isNotEmpty) && isCurrentUser) {
          context.pushRoute(
            UserListsPageRoute(
              user: user,
              isCurrentUser: isCurrentUser,
              isUserLoggedIn: isUserLoggedIn,
              selectedUserListTypeFromPreviousPage: UserListType.INNER_CIRCLE,
            ),
          );
        }
      },
      child: AlignPositioned.relative(
        moveByChildWidth: 2,
        moveByChildHeight: -3.5,
        container: SizedBox(
          width: width,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (user.isLoading)
                shimmer(shimmerChild: const Text('-'))
              else
                Text(
                  isCurrentUser
                      ? user.userStats.innerCircleCountFormatted
                      : user.userStats.postCountFormatted,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              if (user.isLoading)
                shimmer(shimmerChild: Text(bottomText))
              else
                Text(bottomText),
            ],
          ),
        ),
        child: ((!user.isLoading || user.id.isNotEmpty) &&
                isCurrentUser &&
                (user.userStats.innerCircleCount) == 0)
            ? Container(
                width: 5.0,
                height: 5.0,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
              )
            : Container(),
      ),
    );
  }

  Widget _followingStatus(
    double width,
    WildrUser user,
    bool isCurrentUser,
    bool isUserLoggedIn,
    BuildContext context,
  ) =>
      SizedBox(
        width: width,
        child: InkWell(
          onTap: user.isLoading
              ? null
              : () {
                  Future<Object?> sendToFollowing() => context.pushRoute(
                        UserListsPageRoute(
                          user: user,
                          isCurrentUser: isCurrentUser,
                          isUserLoggedIn: isUserLoggedIn,
                          selectedUserListTypeFromPreviousPage:
                              UserListType.FOLLOWING,
                        ),
                      );
                  if (isCurrentUser) {
                    sendToFollowing();
                  } else if (user.visibilityPreferences?.list.following !=
                      UserListVisibility.EVERYONE) {
                    ProfilePagePopups(context)
                        .showRestrictedList(UserListType.FOLLOWING);
                  } else {
                    sendToFollowing();
                  }
                },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (user.isLoading)
                shimmer(shimmerChild: const Text('-'))
              else
                user.visibilityPreferences?.list.following ==
                            UserListVisibility.EVERYONE ||
                        isCurrentUser
                    ? Text(
                        user.userStats.followingCountFormatted,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      )
                    : const WildrIcon(WildrIcons.lock_closed_filled),
              if (user.isLoading)
                shimmer(
                  shimmerChild:
                      Text(AppLocalizations.of(context)!.feed_cap_following),
                )
              else
                Text(AppLocalizations.of(context)!.feed_cap_following),
            ],
          ),
        ),
      );

  Widget _followerStatus(
    double width,
    WildrUser user,
    bool isCurrentUser,
    bool isUserLoggedIn,
    BuildContext context,
  ) =>
      SizedBox(
        width: width,
        child: InkWell(
          onTap: user.isLoading
              ? null
              : () {
                  Future<Object?> sendToFollower() => context.pushRoute(
                        UserListsPageRoute(
                          user: user,
                          isCurrentUser: isCurrentUser,
                          isUserLoggedIn: isUserLoggedIn,
                          selectedUserListTypeFromPreviousPage:
                              UserListType.FOLLOWERS,
                        ),
                      );
                  if (isCurrentUser) {
                    sendToFollower();
                  } else if (user.visibilityPreferences?.list.follower !=
                      UserListVisibility.EVERYONE) {
                    ProfilePagePopups(context)
                        .showRestrictedList(UserListType.FOLLOWERS);
                  } else {
                    sendToFollower();
                  }
                },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (user.isLoading)
                shimmer(shimmerChild: const Text('-'))
              else
                user.visibilityPreferences?.list.follower ==
                            UserListVisibility.EVERYONE ||
                        isCurrentUser
                    ? Text(
                        user.userStats.followerCountFormatted,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      )
                    : const WildrIcon(WildrIcons.lock_closed_filled),
              if (user.isLoading)
                shimmer(
                  shimmerChild:
                      Text(AppLocalizations.of(context)!.profile_cap_followers),
                )
              else
                Text(AppLocalizations.of(context)!.profile_cap_followers),
            ],
          ),
        ),
      );

  Widget status(
    WildrUser user,
    // ignore: avoid_positional_boolean_parameters
    bool isCurrentUser,
    bool isUserLoggedIn,
    BuildContext context,
  ) {
    final double width = 90.0.w;
    return SizedBox(
      height: 70,
      width: Get.width,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _innerCircleOrPostCount(
            width,
            user,
            isCurrentUser,
            isUserLoggedIn,
            context,
          ),
          _followingStatus(width, user, isCurrentUser, isUserLoggedIn, context),
          _followerStatus(width, user, isCurrentUser, isUserLoggedIn, context),
        ],
      ),
    );
  }

  Widget spacing() => SizedBox(
        height: 1.5.h,
      );

  Future<String> generateInviteShortDeepLink({
    required BuildContext context,
    required String code,
    required String title,
    bool? hasAction,
    String? socialMetaTagImageUrl,
  }) async {
    String link = FlavorConfig.getValue(kDynamicLinkUrl);
    link += '/';
    link += FDLPathSegments.invite;
    link += '?';
    link += '${FDLParams.code}=$code';
    link += '&';
    link += '${FDLParams.source}=${FDLParamValues.linkSourceReferral}';
    link += Common().getReferrerParams(context);
    if (hasAction ?? false) link += '&${FDLParams.inviteCodeAction}=true';
    print('Link = $link');
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: FlavorConfig.getValue(kDynamicLinkUrlPrefix) +
          '/' +
          FDLPathSegments.invite,
      link: Uri.parse(link),
      androidParameters: AndroidParameters(
        packageName: FlavorConfig.getValue(kPackageName),
        minimumVersion: 1,
      ),
      iosParameters: IOSParameters(
        bundleId: FlavorConfig.getValue(kPackageName),
        minimumVersion: '1.1.0',
        appStoreId: FlavorConfig.getValue(kAppStoreId),
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: title,
        imageUrl: Uri.parse(socialMetaTagImageUrl ?? kInviteLinkDefaultUrl),
      ),
    );
    final ShortDynamicLink shortDynamicLink =
        await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    return shortDynamicLink.shortUrl.toString();
  }
}
