import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

const kServerUrl = 'server_url';
const kDynamicLinkUrlPrefix = 'dynamic_link_url_prefix';
const kEnvironment = 'environment';
const kDynamicLinkUrl = 'dynamic_link_url';
const kDynamicLinkFirstSharePostPathSegment =
    'dynamic_link_share_post_first_path_segment';
const kPackageName = 'package_name';
const kAppStoreId = 'appstore_id';
const kGooglePlayId = 'google_play_id';

const kBaseWebsiteUrl = 'base_website_url';
const kCanPrintLogs = 'can_print_logs';
const kSomethingWentWrong = 'Oops! Something went wrong';
const kNoInternetError = 'Connection lost, please try again';
const kUpdatePreferences =
    'You can always change your preferences again by going to your settings.';
const kWildrLogoUrl = 'https://d1h8rem1j07piu.cloudfront.net/wildr_logo.png';
const kInviteLinkDefaultUrl =
    'https://dngq9bnvlhuzb.cloudfront.net/wildr-invitation.png';
const kPresetCoverPhotoBaseUrl = 'https://d2yle7zt71nqgn.cloudfront.net/covers';
const kFirebaseAuthExceptionKey = 'firebase-auth-error';
const kLocalError = 'local-error';
const kNoInternet = 'no-internet';
const kNA = 'N/A';

const kInviteOnWildrMessage =
    "Join me on Wildr, the world's first toxicity-free social app! ✨";
const kInviteToInnerCircle = 'Hey! I want to add you to my Inner Circle'
    ' on Wildr. Tap the link to join ✨';

const kAppMinimumAge = '13';

const LOGIN_SUCCESSFUL_FROM_INVITE_CODE_PAGE = 112233;

const kICRequestForContactsMessage =
    'Enabling access to your contact list allows you to send '
    'them an invite link directly via text message. Wildr does not collect,'
    ' store, use or share this information in any other way.';
const kICRequestForContactsTitle = 'Allow contacts access to invite people';

const String kCameraErrorMessage = '''
Oops! We can't continue with
verification right now because we
couldn't detect your camera.
''';

const String kCameraAccessMessage = '''
We need to access your camera
to proceed with verification
''';

const kLoading = 'LOADING';

const kTokenMaxRetryAttempts = 4;
const kGetTokenRetryDelayDuration = Duration(seconds: 10);

const kGQLClientAuthorizationHeaderKey = 'Authorization';

//Page ids
const HOME_FEED_PAGE_ID = 'HOME_FEED_PAGE_ID';
const EXPLORE_FEED_PAGE_ID = 'EXPLORE_FEED_PAGE_ID';
const CURRENT_USER_FEED_PAGE_ID = 'CURRENT_USER_FEED_PAGE_ID';
const ANY_USER_FEED_PAGE_ID = 'ANY_USER_FEED_PAGE_ID';
const SINGLE_POST_PAGE_ID = 'SINGLE_POST_PAGE_ID';
const NOTIFICATIONS_PAGE_ID = 'NOTIFICATIONS_PAGE_ID';
const CURRENT_USER_PROFILE_PAGE_ID = 'CURRENT_USER_PROFILE_PAGE_ID';

//Page Actions
const OPEN_APP_SETTINGS = 'open_app_settings';

const List<List<Color>> colorGradientPresets = [
  [WildrColors.springGreen700, WildrColors.gold400],
  [WildrColors.gold700, WildrColors.red300],
  [WildrColors.indigo500, WildrColors.sherpaBlue200],
  [WildrColors.gold700, WildrColors.sherpaBlue200],
  [WildrColors.springGreen1300, WildrColors.gold1100],
  [WildrColors.gold1200, WildrColors.red1000],
  [WildrColors.indigo1000, WildrColors.sherpaBlue1000],
  [WildrColors.gold1100, WildrColors.sherpaBlue1000],
];

const DEFAULT_TEXT_POST_GRADIENT =
    LinearGradient(colors: [WildrColors.gray900, WildrColors.gray900]);

//Preferred value for THUMBNAIL_SIZE
const THUMBNAIL_SIZE_VALUE = 250;
const KMentionItemSizeFactorToScreenHeight = .08;

final double mentionsItemHeight =
    Get.height * KMentionItemSizeFactorToScreenHeight;
