import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/debug_menu.dart';
import 'package:wildr_flutter/contacts/pages/contacts_page.dart';
import 'package:wildr_flutter/entry_point.dart';
import 'package:wildr_flutter/feat_challenges/create/create_challenge_page.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/challenge_more_entries_page.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/single_challenge_page.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/coin_waitlist_page.dart';
import 'package:wildr_flutter/feat_comments_and_replies/comments_page.dart';
import 'package:wildr_flutter/feat_comments_and_replies/likes_page.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/pages/post_settings_page.dart';
import 'package:wildr_flutter/feat_create_post/v1/create_post_page_v1.dart';
import 'package:wildr_flutter/feat_create_post/v1/edit_text_post_v1.dart';
import 'package:wildr_flutter/feat_create_post/v1/preview_crop_media_post.dart';
import 'package:wildr_flutter/feat_create_post/v1/preview_multi_post.dart';
import 'package:wildr_flutter/feat_create_post/v1/preview_repost.dart';
import 'package:wildr_flutter/feat_create_post/v1/upload_multi_post_v1.dart';
import 'package:wildr_flutter/feat_create_post/v2/create_post_page_v2.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/draft_preview_page.dart';
import 'package:wildr_flutter/feat_create_post/v2/post_preview_page.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/create_text_post.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/edit_text_post.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_multi_post_v2.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_tab/select_album_page.dart';
import 'package:wildr_flutter/feat_notifications/notifications_page.dart';
import 'package:wildr_flutter/feat_post/reposts/reposts_list_page.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_page.dart';
import 'package:wildr_flutter/feat_profile/profile/about_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/delete_user_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_bio_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_email/change_password_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_email/edit_email_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_email/link_email_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_email/unlink_email_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_handle_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_name_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/edit_pronoun_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/link_phone_number_page.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_profile_page.dart';
import 'package:wildr_flutter/feat_profile/profile/popups/onboarding_inner_circle.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_current_user.dart';
import 'package:wildr_flutter/feat_profile/profile/settings_page.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/page/user_lists_page.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_single_tag_page.dart';
import 'package:wildr_flutter/feat_upsell_banner/presentation/waitlist_joined_success_page.dart';
import 'package:wildr_flutter/feat_upsell_banner/presentation/wildrcoin_benefits_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/review_face_verification_photo_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/review_photo_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_face_verification_camera_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verify_face_verification_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verify_identity_page.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verify_photo_rules_page.dart';
import 'package:wildr_flutter/force_update/force_update_page.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/home/strike/strike_info_page.dart';
import 'package:wildr_flutter/login_signup/forgot_password/forgot_password_page.dart';
import 'package:wildr_flutter/login_signup/forgot_password/password_reset_link_sent_page.dart';
import 'package:wildr_flutter/login_signup/login_email_or_phone_page.dart';
import 'package:wildr_flutter/login_signup/login_page.dart';
import 'package:wildr_flutter/login_signup/more_help_page/more_help_page.dart';
import 'package:wildr_flutter/login_signup/signup/ask_for_handle_signup_page.dart';
import 'package:wildr_flutter/login_signup/signup/upload_profile_photo_page.dart';
import 'package:wildr_flutter/login_signup/verification_page.dart';
import 'package:wildr_flutter/login_signup/wait_for_email_verification_page.dart';
import 'package:wildr_flutter/onboarding/page/challenges_onboarding_page.dart';
import 'package:wildr_flutter/onboarding/page/content_preference_finish_page.dart';
import 'package:wildr_flutter/onboarding/page/content_preference_onboarding_page.dart';
import 'package:wildr_flutter/onboarding/page/content_preference_start_page.dart';
import 'package:wildr_flutter/onboarding/page/onboarding_v3.dart';
import 'package:wildr_flutter/post_feed/challenge_post_entries_page.dart';
import 'package:wildr_flutter/post_feed/posts_feed_page.dart';
import 'package:wildr_flutter/web_pages/community_guidelines_page.dart';
import 'package:wildr_flutter/web_pages/contact_us_page.dart';
import 'package:wildr_flutter/web_pages/privacy_policy_page.dart';
import 'package:wildr_flutter/web_pages/terms_of_service_page.dart';

@MaterialAutoRouter(
  routes: <AutoRoute>[
    // * Challenges routes
    AutoRoute(
      page: ChallengesOnboardingPage,
    ),
    AutoRoute(
      page: UploadProfilePhotoPage,
      fullscreenDialog: true,
    ),

    AutoRoute(page: CreateChallengePage, fullscreenDialog: true),
    AutoRoute(page: SingleChallengePage),
    AutoRoute(page: ChallengePostEntriesPage),

    // * wildr verify
    AutoRoute(page: WildrVerifyIntroPage),
    AutoRoute(page: WildrVerifyIdentityPage),
    AutoRoute(page: WildrVerifyPhotoRulesPage),
    AutoRoute(page: ReviewPhotoPage),
    AutoRoute(page: WildrVerifyFaceVerificationPage),
    AutoRoute(page: WildrFaceVerificationCameraPage),
    AutoRoute(page: ReviewFaceVerificationPhotoPage),
    AutoRoute(page: WildrVerifiedPage),

    AutoRoute(page: EntryPage, initial: true),
    AutoRoute(page: HomePage),
    AutoRoute(page: LicensePage),
    AutoRoute(page: NotificationsPage),
    // * Login routes
    AutoRoute(page: LoginEmailOrPhonePage),
    AutoRoute(page: LoginPage),
    AutoRoute(page: OnboardingV3Page),
    AutoRoute(page: ForgotPasswordPage),
    AutoRoute(page: PasswordResetLinkSentPage),
    AutoRoute(page: VerificationPage),
    AutoRoute(page: WaitForEmailVerificationPage),
    AutoRoute(page: AskForHandleAndSignUpPage),
    AutoRoute(page: CommentsPage),
    AutoRoute(page: RepliesPage),
    AutoRoute(page: LikesPage),
    AutoRoute(page: SinglePostPage),
    AutoRoute(page: StrikeInfoPage),
    // 2 - Discovery and search routes
    AutoRoute(page: SearchPage),
    AutoRoute(page: SearchSingleTagPage),
    // 4 - Profile routes
    AutoRoute(page: ProfilePage),
    AutoRoute(page: CurrentUserProfilePage),
    AutoRoute(page: PostsFeedPage),
    AutoRoute(page: UserListsPage),
    // Edit profile routes
    AutoRoute(page: EditProfilePage),
    AutoRoute(page: EditHandlePage),
    AutoRoute(page: EditNamePage),
    AutoRoute(page: EditPronounPage),
    AutoRoute(page: EditBioPage),
    AutoRoute(page: EditEmailPage),
    AutoRoute(page: LinkEmailPage),
    AutoRoute(page: UnlinkEmailPage),
    AutoRoute(page: ChangePasswordPage),
    AutoRoute(page: LinkPhoneNumberPage),
    AutoRoute(page: DeleteUserPage),
    // * Contact routes
    AutoRoute(page: ContactsPage),
    // * Create post routes
    AutoRoute(page: CreatePostPageV1, fullscreenDialog: true),
    AutoRoute(page: PreviewMultiPostPage),
    AutoRoute(page: UploadMultiMediaPostV1, fullscreenDialog: true),
    AutoRoute(page: PreviewAndCropMediaPost),
    AutoRoute(page: EditTextPostV1),

    //Create Post v2
    AutoRoute(page: SelectAlbumPage),
    AutoRoute(page: PostPreviewPage),
    AutoRoute(page: DraftPreviewPage),
    AutoRoute(page: CreatePostPageV2),
    AutoRoute(page: CreateTextPost),
    AutoRoute(page: EditTextPostPage),
    AutoRoute(page: UploadMultiMediaPostV2),

    // * Settings routes
    AutoRoute(page: SettingsPage),
    AutoRoute(page: PostSettingsPage),
    AutoRoute(page: AboutPage),
    // * Debug routes
    AutoRoute(page: DebugMenu),
    // * Other routes
    AutoRoute(page: TermsOfServicePage),
    AutoRoute(page: PrivacyPolicyPage),
    AutoRoute(page: CommunityGuidelinesPage),
    AutoRoute(page: ContactUsPage),
    // * Onboarding routes
    AutoRoute(page: OnboardingInnerCircle, fullscreenDialog: true),
    AutoRoute(page: ContentPreferenceStartPage),
    AutoRoute(page: ContentPreferenceOnboardingPage),
    AutoRoute(page: ContentPreferenceFinishPage),
    //Repost routes
    AutoRoute(page: RepostsListPage),
    AutoRoute(page: PreviewRepostPage),
    //Force Update Routes
    AutoRoute(page: ForceUpdatePage),
    AutoRoute(page: ChallengeMoreEntriesPage),
    AutoRoute(page: ChallengesOnboardingPage),
    AutoRoute(page: UploadProfilePhotoPage),

    // Coin
    AutoRoute(page: WalletWaitlistDashboardPage),

    //Upsell Routes
    AutoRoute(page: WildrCoinBenefitsPage),
    AutoRoute(page: WaitlistJoinedSuccessPage),

    //Help Routes
    AutoRoute(page: MoreHelpPage),
  ],
)
class $AppRouter {}
