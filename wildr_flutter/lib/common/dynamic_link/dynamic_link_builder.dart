import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';

mixin DynamicLinkBuilder {
  static Future<String> inviteLink(BuildContext context) async {
    String link = FlavorConfig.getValue(kDynamicLinkUrl);
    link += '/';
    link += FDLPathSegments.invite;
    link += '?';
    link += '${FDLParams.source}=${FDLParamValues.linkSourceReferral}';
    link += Common().getReferrerParams(context);
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: FlavorConfig.getValue(kDynamicLinkUrlPrefix) +
          '/' +
          FDLPathSegments.invite,
      link: Uri.parse(link),
      androidParameters: AndroidParameters(
        packageName: FlavorConfig.getValue(kPackageName),
        minimumVersion: 0,
      ),
      iosParameters: IOSParameters(
        bundleId: FlavorConfig.getValue(kPackageName),
        minimumVersion: '2023.07.1',
        appStoreId: FlavorConfig.getValue(kAppStoreId),
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title:
            AppLocalizations.of(context)!.wildrcoin_success_page_sharing_title,
        description: AppLocalizations.of(context)!
            .wildrcoin_success_page_sharing_subtitle,
        imageUrl: Uri.parse(kInviteLinkDefaultUrl),
      ),
    );
    final ShortDynamicLink shortDynamicLink =
        await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    return shortDynamicLink.shortUrl.toString();
  }
}
