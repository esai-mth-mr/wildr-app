import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page_common.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/routes.gr.dart';

class SearchPageUserTile extends StatelessWidget {
  final WildrUser user;
  final double? width;
  final double? height;

  const SearchPageUserTile(
    this.user,
    BuildContext context, {
    this.width,
    this.height,
    super.key,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
      onTap: () =>
          context.pushRoute(ProfilePageRoute(idOfUserToFetch: user.id)),
      child: SizedBox(
        width: width,
        height: height,
        child: Column(
          children: [
            Common().avatarFromUser(
              context,
              user,
              shouldNavigateToCurrentUser: false,
              // radius: 35,
            ),
            Text(
              '@${user.handle}',
              style: SearchPageCommon.titleTextStyle,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if ((user.name?.length ?? 0) > 0)
              Text(
                user.name ?? '__',
                style: SearchPageCommon.subtitleStyle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            Expanded(child: Container()),
          ],
        ),
      ),
    );
}

class SearchPageLoadingUserTile extends StatelessWidget {
  const SearchPageLoadingUserTile({super.key});

  @override
  Widget build(BuildContext context) => Column(
      children: [
        ProfilePageCommon().shimmer(
          shimmerChild: const CircleAvatar(
            backgroundColor: Colors.white,
            radius: 50,
          ),
        ),
        ProfilePageCommon().shimmer(isLoadingText: true),
      ],
    );
}
