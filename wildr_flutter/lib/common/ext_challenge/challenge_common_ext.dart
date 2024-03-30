part of '../common.dart';

extension ChallengeExtOnCommon on Common {
  Future<void> shareChallenge(
    BuildContext context, {
    required Challenge challenge,
    int? inviteCode,
  }) async {
    Common().mainBloc(context).logCustomEvent(
      ChallengesAnalyticsEvents.kTapChallengeShareButton,
      {ChallengesAnalyticsParameters.kChallengeId: challenge.id},
    );
    String challengeShareLink = FlavorConfig.getValue(kDynamicLinkUrl);
    challengeShareLink += '/challenges';
    challengeShareLink += '?';
    challengeShareLink += '${FDLParams.objectId}=${challenge.id}';
    challengeShareLink += '&';
    challengeShareLink +=
        '${FDLParams.source}=${FDLParamValues.linkSourceChallenge}';
    challengeShareLink += Common().getReferrerParams(context);
    if (inviteCode != null) {
      challengeShareLink += '&';
      challengeShareLink += '${FDLParams.code}=$inviteCode';
    }
    debugPrint('Share link $challengeShareLink');
    final String? coverImageUrl = challenge.cover?.coverImage?.image?.uri;
    final String? presetCoverImageUrl = challenge.cover?.coverImageEnum?.uri;
    final Uri? imageUrl;
    if (coverImageUrl != null) {
      imageUrl = Uri.parse(coverImageUrl);
    } else if (presetCoverImageUrl != null) {
      imageUrl = Uri.parse(presetCoverImageUrl);
    } else {
      imageUrl = null;
    }
    final parameters = DynamicLinkParameters(
      link: Uri.parse(challengeShareLink),
      uriPrefix: '${FlavorConfig.getValue(kDynamicLinkUrlPrefix)}/challenges',
      androidParameters: AndroidParameters(
        packageName: FlavorConfig.getValue(kPackageName),
        minimumVersion: 0,
      ),
      iosParameters: IOSParameters(
        bundleId: FlavorConfig.getValue(kPackageName),
        minimumVersion: '0.0.1',
        appStoreId: FlavorConfig.getValue(kAppStoreId),
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: '"${challenge.name}" '
            'by ${challenge.author.name ?? challenge.author.handle}'
            ' on Wildr',
        imageUrl: imageUrl,
      ),
    );
    final link = await FirebaseDynamicLinks.instance.buildLink(parameters);
    debugPrint(link.toString());
    final ShortDynamicLink shortDynamicLink =
        await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    await Share.share(shortDynamicLink.shortUrl.toString());
  }
}
