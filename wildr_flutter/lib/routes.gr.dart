// **************************************************************************
// AutoRouteGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouteGenerator
// **************************************************************************
//
// ignore_for_file: type=lint

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'dart:io' as _i82;

import 'package:auto_route/auto_route.dart' as _i80;
import 'package:flutter/material.dart' as _i16;
import 'package:photo_manager/photo_manager.dart' as _i94;

import 'bloc/main/main_bloc.dart' as _i89;
import 'common/common.dart' as _i96;
import 'common/debug_menu.dart' as _i63;
import 'common/home_page_intent/home_page_intent.dart' as _i81;
import 'contacts/pages/contacts_page.dart' as _i47;
import 'entry_point.dart' as _i14;
import 'feat_challenges/create/create_challenge_page.dart' as _i3;
import 'feat_challenges/models/categories.dart' as _i85;
import 'feat_challenges/models/challenge.dart' as _i92;
import 'feat_challenges/single_challenge/bloc/single_challenge_bloc.dart'
    as _i83;
import 'feat_challenges/single_challenge/challenge_more_entries_page.dart'
    as _i75;
import 'feat_challenges/single_challenge/single_challenge_page.dart' as _i4;
import 'feat_coin/waitlist/presentation/coin_waitlist_page.dart' as _i76;
import 'feat_comments_and_replies/comments_page.dart' as _i26;
import 'feat_comments_and_replies/likes_page.dart' as _i27;
import 'feat_create_post/gxc/create_post_gxc.dart' as _i93;
import 'feat_create_post/post_settings/pages/post_settings_page.dart' as _i61;
import 'feat_create_post/post_settings/post_draft_setting.dart' as _i95;
import 'feat_create_post/v1/create_post_page_v1.dart' as _i48;
import 'feat_create_post/v1/edit_text_post_v1.dart' as _i52;
import 'feat_create_post/v1/preview_crop_media_post.dart' as _i51;
import 'feat_create_post/v1/preview_multi_post.dart' as _i49;
import 'feat_create_post/v1/preview_repost.dart' as _i73;
import 'feat_create_post/v1/upload_multi_post_v1.dart' as _i50;
import 'feat_create_post/v2/create_post_page_v2.dart' as _i56;
import 'feat_create_post/v2/draft/draft_preview_page.dart' as _i55;
import 'feat_create_post/v2/post_preview_page.dart' as _i54;
import 'feat_create_post/v2/text_tab/create_text_post.dart' as _i57;
import 'feat_create_post/v2/text_tab/edit_text_post.dart' as _i58;
import 'feat_create_post/v2/upload_multi_post_v2.dart' as _i59;
import 'feat_create_post/v2/upload_tab/select_album_page.dart' as _i53;
import 'feat_feed/feed_gxc.dart' as _i90;
import 'feat_notifications/notifications_page.dart' as _i17;
import 'feat_post/model/post.dart' as _i87;
import 'feat_post/reposts/reposts_list_page.dart' as _i72;
import 'feat_post/single_post_page/single_post_page.dart' as _i28;
import 'feat_profile/profile/about_page.dart' as _i62;
import 'feat_profile/profile/edit_details/delete_user_page.dart' as _i46;
import 'feat_profile/profile/edit_details/edit_bio_page.dart' as _i40;
import 'feat_profile/profile/edit_details/edit_email/change_password_page.dart'
    as _i44;
import 'feat_profile/profile/edit_details/edit_email/edit_email_page.dart'
    as _i41;
import 'feat_profile/profile/edit_details/edit_email/link_email_page.dart'
    as _i42;
import 'feat_profile/profile/edit_details/edit_email/unlink_email_page.dart'
    as _i43;
import 'feat_profile/profile/edit_details/edit_handle_page.dart' as _i37;
import 'feat_profile/profile/edit_details/edit_name_page.dart' as _i38;
import 'feat_profile/profile/edit_details/edit_pronoun_page.dart' as _i39;
import 'feat_profile/profile/edit_details/link_phone_number_page.dart' as _i45;
import 'feat_profile/profile/edit_profile_page.dart' as _i36;
import 'feat_profile/profile/popups/onboarding_inner_circle.dart' as _i68;
import 'feat_profile/profile/profile_page.dart' as _i32;
import 'feat_profile/profile/profile_page_current_user.dart' as _i33;
import 'feat_profile/profile/settings_page.dart' as _i60;
import 'feat_profile/profile/user_lists/data/user_list_type.dart' as _i91;
import 'feat_profile/profile/user_lists/page/user_lists_page.dart' as _i35;
import 'feat_search_explore/search/search_page.dart' as _i30;
import 'feat_search_explore/search/search_single_tag_page.dart' as _i31;
import 'feat_upsell_banner/presentation/waitlist_joined_success_page.dart'
    as _i78;
import 'feat_upsell_banner/presentation/wildrcoin_benefits_page.dart' as _i77;
import 'feat_wildr_verified/pages/review_face_verification_photo_page.dart'
    as _i12;
import 'feat_wildr_verified/pages/review_photo_page.dart' as _i9;
import 'feat_wildr_verified/pages/wildr_face_verification_camera_page.dart'
    as _i11;
import 'feat_wildr_verified/pages/wildr_verified_intro_page.dart' as _i6;
import 'feat_wildr_verified/pages/wildr_verified_page.dart' as _i13;
import 'feat_wildr_verified/pages/wildr_verify_face_verification_page.dart'
    as _i10;
import 'feat_wildr_verified/pages/wildr_verify_identity_page.dart' as _i7;
import 'feat_wildr_verified/pages/wildr_verify_photo_rules_page.dart' as _i8;
import 'force_update/force_update_page.dart' as _i74;
import 'gql_isolate_bloc/challenges_ext/challenge_queries.dart' as _i97;
import 'home/home_page.dart' as _i15;
import 'home/model/pronoun.dart' as _i84;
import 'home/model/wildr_user.dart' as _i88;
import 'home/strike/strike_info_page.dart' as _i29;
import 'login_signup/forgot_password/forgot_password_page.dart' as _i21;
import 'login_signup/forgot_password/password_reset_link_sent_page.dart'
    as _i22;
import 'login_signup/login_email_or_phone_page.dart' as _i18;
import 'login_signup/login_page.dart' as _i19;
import 'login_signup/more_help_page/more_help_page.dart' as _i79;
import 'login_signup/signup/ask_for_handle_signup_page.dart' as _i25;
import 'login_signup/signup/signup_signup_after_handle_details.dart' as _i86;
import 'login_signup/signup/upload_profile_photo_page.dart' as _i2;
import 'login_signup/verification_page.dart' as _i23;
import 'login_signup/wait_for_email_verification_page.dart' as _i24;
import 'onboarding/page/challenges_onboarding_page.dart' as _i1;
import 'onboarding/page/content_preference_finish_page.dart' as _i71;
import 'onboarding/page/content_preference_onboarding_page.dart' as _i70;
import 'onboarding/page/content_preference_start_page.dart' as _i69;
import 'onboarding/page/onboarding_v3.dart' as _i20;
import 'post_feed/challenge_post_entries_page.dart' as _i5;
import 'post_feed/posts_feed_page.dart' as _i34;
import 'web_pages/community_guidelines_page.dart' as _i66;
import 'web_pages/contact_us_page.dart' as _i67;
import 'web_pages/privacy_policy_page.dart' as _i65;
import 'web_pages/terms_of_service_page.dart' as _i64;

class AppRouter extends _i80.RootStackRouter {
  AppRouter([_i16.GlobalKey<_i16.NavigatorState>? navigatorKey])
      : super(navigatorKey);

  @override
  final Map<String, _i80.PageFactory> pagesMap = {
    ChallengesOnboardingPageRoute.name: (routeData) {
      final args = routeData.argsAs<ChallengesOnboardingPageRouteArgs>(
          orElse: () => const ChallengesOnboardingPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i1.ChallengesOnboardingPage(
          key: args.key,
          entryPointIntent: args.entryPointIntent,
          skipLoginFlow: args.skipLoginFlow,
          showBackButton: args.showBackButton,
          isEntryPoint: args.isEntryPoint,
          isChallengeEducation: args.isChallengeEducation,
          entryPointCallback: args.entryPointCallback,
          isDynamicLinkRedirect: args.isDynamicLinkRedirect,
        ),
      );
    },
    UploadProfilePhotoPageRoute.name: (routeData) {
      final args = routeData.argsAs<UploadProfilePhotoPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i2.UploadProfilePhotoPage(
          key: args.key,
          onProfilePhotoSaved: args.onProfilePhotoSaved,
        ),
      );
    },
    CreateChallengePageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i3.CreateChallengePage(),
        fullscreenDialog: true,
      );
    },
    SingleChallengePageRoute.name: (routeData) {
      final args = routeData.argsAs<SingleChallengePageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i4.SingleChallengePage(
          key: args.key,
          challengeId: args.challengeId,
          commentToNavigateToId: args.commentToNavigateToId,
          replyToNavigateToId: args.replyToNavigateToId,
        ),
      );
    },
    ChallengePostEntriesPageRoute.name: (routeData) {
      final args = routeData.argsAs<ChallengePostEntriesPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i5.ChallengePostEntriesPage(
          key: args.key,
          challengeId: args.challengeId,
          fetchPostsUserId: args.fetchPostsUserId,
          participantHandle: args.participantHandle,
          bloc: args.bloc,
        ),
      );
    },
    WildrVerifyIntroPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i6.WildrVerifyIntroPage(),
      );
    },
    WildrVerifyIdentityPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i7.WildrVerifyIdentityPage(),
      );
    },
    WildrVerifyPhotoRulesPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i8.WildrVerifyPhotoRulesPage(),
      );
    },
    ReviewPhotoPageRoute.name: (routeData) {
      final args = routeData.argsAs<ReviewPhotoPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i9.ReviewPhotoPage(
          key: args.key,
          imageFile: args.imageFile,
        ),
      );
    },
    WildrVerifyFaceVerificationPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i10.WildrVerifyFaceVerificationPage(),
      );
    },
    WildrFaceVerificationCameraPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i11.WildrFaceVerificationCameraPage(),
      );
    },
    ReviewFaceVerificationPhotoPageRoute.name: (routeData) {
      final args = routeData.argsAs<ReviewFaceVerificationPhotoPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i12.ReviewFaceVerificationPhotoPage(
          key: args.key,
          imageFile: args.imageFile,
        ),
      );
    },
    WildrVerifiedPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i13.WildrVerifiedPage(),
      );
    },
    EntryPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i14.EntryPage(),
      );
    },
    HomePageRoute.name: (routeData) {
      final args = routeData.argsAs<HomePageRouteArgs>(
          orElse: () => const HomePageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i15.HomePage(
          key: args.key,
          shouldRefreshFeed: args.shouldRefreshFeed,
          intent: args.intent,
        ),
      );
    },
    LicensePageRoute.name: (routeData) {
      final args = routeData.argsAs<LicensePageRouteArgs>(
          orElse: () => const LicensePageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i16.LicensePage(
          key: args.key,
          applicationName: args.applicationName,
          applicationVersion: args.applicationVersion,
          applicationIcon: args.applicationIcon,
          applicationLegalese: args.applicationLegalese,
        ),
      );
    },
    NotificationsPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i17.NotificationsPage(),
      );
    },
    LoginEmailOrPhonePageRoute.name: (routeData) {
      final args = routeData.argsAs<LoginEmailOrPhonePageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i18.LoginEmailOrPhonePage(
          key: args.key,
          phoneNumberTextEditingController:
              args.phoneNumberTextEditingController,
          emailTextEditingController: args.emailTextEditingController,
          passwordTextEditingController: args.passwordTextEditingController,
          onPhoneSendVerificationCodePressed:
              args.onPhoneSendVerificationCodePressed,
          onEmailContinuePressed: args.onEmailContinuePressed,
          onEmailContinueLongPress: args.onEmailContinueLongPress,
        ),
      );
    },
    LoginPageRoute.name: (routeData) {
      final args = routeData.argsAs<LoginPageRouteArgs>(
          orElse: () => const LoginPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i19.LoginPage(
          key: args.key,
          isOpenedUsingGet: args.isOpenedUsingGet,
          pronoun: args.pronoun,
          birthday: args.birthday,
          categories: args.categories,
          isSignup: args.isSignup,
        ),
      );
    },
    OnboardingV3PageRoute.name: (routeData) {
      final args = routeData.argsAs<OnboardingV3PageRouteArgs>(
          orElse: () => const OnboardingV3PageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i20.OnboardingV3Page(
          key: args.key,
          isEntryPoint: args.isEntryPoint,
          onSkipTapped: args.onSkipTapped,
          bodyData: args.bodyData,
        ),
      );
    },
    ForgotPasswordPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i21.ForgotPasswordPage(),
      );
    },
    PasswordResetLinkSentPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i22.PasswordResetLinkSentPage(),
      );
    },
    VerificationPageRoute.name: (routeData) {
      final args = routeData.argsAs<VerificationPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i23.VerificationPage(
          key: args.key,
          onBackPressed: args.onBackPressed,
          onChanged: args.onChanged,
          onComplete: args.onComplete,
          phoneNumber: args.phoneNumber,
          onResendCode: args.onResendCode,
          isSignUp: args.isSignUp,
        ),
      );
    },
    WaitForEmailVerificationPageRoute.name: (routeData) {
      final args = routeData.argsAs<WaitForEmailVerificationPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i24.WaitForEmailVerificationPage(
          key: args.key,
          isSignUp: args.isSignUp,
          showUnlink: args.showUnlink,
          email: args.email,
          type: args.type,
        ),
      );
    },
    AskForHandleAndSignUpPageRoute.name: (routeData) {
      final args = routeData.argsAs<AskForHandleAndSignUpPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i25.AskForHandleAndSignUpPage(
          key: args.key,
          signUpDetails: args.signUpDetails,
        ),
      );
    },
    CommentsPageRoute.name: (routeData) {
      final args = routeData.argsAs<CommentsPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i26.CommentsPage(
          key: args.key,
          parent: args.parent,
          commentToNavigateToId: args.commentToNavigateToId,
          replyToNavigateToId: args.replyToNavigateToId,
          parentPageId: args.parentPageId,
        ),
      );
    },
    RepliesPageRoute.name: (routeData) {
      final args = routeData.argsAs<RepliesPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i26.RepliesPage(
          parentPageId: args.parentPageId,
          boxDecoration: args.boxDecoration,
          inputDecoration: args.inputDecoration,
          keyboardBasedEdgeInsets: args.keyboardBasedEdgeInsets,
          focusNode: args.focusNode,
          canReplyStr: args.canReplyStr,
          showLoader: args.showLoader,
          canViewCommentsStr: args.canViewCommentsStr,
          parent: args.parent,
          replyToNavigateToId: args.replyToNavigateToId,
          key: args.key,
        ),
      );
    },
    LikesPageRoute.name: (routeData) {
      final args = routeData.argsAs<LikesPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i27.LikesPage(
          key: args.key,
          id: args.id,
          likeCount: args.likeCount,
          type: args.type,
        ),
      );
    },
    SinglePostPageRoute.name: (routeData) {
      final args = routeData.argsAs<SinglePostPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i28.SinglePostPage(
          args.postId,
          key: args.key,
          commentToNavigateToId: args.commentToNavigateToId,
          replyToNavigateToId: args.replyToNavigateToId,
          postPageIndex: args.postPageIndex,
        ),
      );
    },
    StrikeInfoPageRoute.name: (routeData) {
      final args = routeData.argsAs<StrikeInfoPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i29.StrikeInfoPage(
          args.reportId,
          key: args.key,
        ),
      );
    },
    SearchPageRoute.name: (routeData) {
      final args = routeData.argsAs<SearchPageRouteArgs>(
          orElse: () => const SearchPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i30.SearchPage(
          key: args.key,
          shouldShowBackButton: args.shouldShowBackButton,
          tagSearch: args.tagSearch,
          goToIndex: args.goToIndex,
        ),
      );
    },
    SearchSingleTagPageRoute.name: (routeData) {
      final args = routeData.argsAs<SearchSingleTagPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i31.SearchSingleTagPage(
          tagName: args.tagName,
          key: args.key,
        ),
      );
    },
    ProfilePageRoute.name: (routeData) {
      final args = routeData.argsAs<ProfilePageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i32.ProfilePage(
          key: args.key,
          idOfUserToFetch: args.idOfUserToFetch,
          userObj: args.userObj,
        ),
      );
    },
    CurrentUserProfilePageRoute.name: (routeData) {
      final args = routeData.argsAs<CurrentUserProfilePageRouteArgs>(
          orElse: () => const CurrentUserProfilePageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i33.CurrentUserProfilePage(
          key: args.key,
          shouldShowBackButtonAndRefresh: args.shouldShowBackButtonAndRefresh,
        ),
      );
    },
    PostsFeedPageRoute.name: (routeData) {
      final args = routeData.argsAs<PostsFeedPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i34.PostsFeedPage(
          mainBloc: args.mainBloc,
          feedGxC: args.feedGxC,
          canPaginate: args.canPaginate,
          onRefresh: args.onRefresh,
          paginate: args.paginate,
          heroTag: args.heroTag,
          pageId: args.pageId,
          key: args.key,
        ),
      );
    },
    UserListsPageRoute.name: (routeData) {
      final args = routeData.argsAs<UserListsPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i35.UserListsPage(
          args.user,
          args.isCurrentUser,
          args.isUserLoggedIn,
          args.selectedUserListTypeFromPreviousPage,
          key: args.key,
        ),
      );
    },
    EditProfilePageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i36.EditProfilePage(),
      );
    },
    EditHandlePageRoute.name: (routeData) {
      final args = routeData.argsAs<EditHandlePageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i37.EditHandlePage(
          args.handle,
          key: args.key,
        ),
      );
    },
    EditNamePageRoute.name: (routeData) {
      final args = routeData.argsAs<EditNamePageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i38.EditNamePage(
          args.name,
          key: args.key,
        ),
      );
    },
    EditPronounPageRoute.name: (routeData) {
      final args = routeData.argsAs<EditPronounPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i39.EditPronounPage(
          args.pronoun,
          key: args.key,
        ),
      );
    },
    EditBioPageRoute.name: (routeData) {
      final args = routeData.argsAs<EditBioPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i40.EditBioPage(
          args.bio,
          key: args.key,
        ),
      );
    },
    EditEmailPageRoute.name: (routeData) {
      final args = routeData.argsAs<EditEmailPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i41.EditEmailPage(
          args.email,
          key: args.key,
        ),
      );
    },
    LinkEmailPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i42.LinkEmailPage(),
      );
    },
    UnlinkEmailPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i43.UnlinkEmailPage(),
      );
    },
    ChangePasswordPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i44.ChangePasswordPage(),
      );
    },
    LinkPhoneNumberPageRoute.name: (routeData) {
      final args = routeData.argsAs<LinkPhoneNumberPageRouteArgs>(
          orElse: () => const LinkPhoneNumberPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i45.LinkPhoneNumberPage(
          key: args.key,
          unlink: args.unlink,
        ),
      );
    },
    DeleteUserPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i46.DeleteUserPage(),
      );
    },
    ContactsPageRoute.name: (routeData) {
      final args = routeData.argsAs<ContactsPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i47.ContactsPage(
          args.userListType,
          key: args.key,
        ),
      );
    },
    CreatePostPageV1Route.name: (routeData) {
      final args = routeData.argsAs<CreatePostPageV1RouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i48.CreatePostPageV1(
          key: args.key,
          mainBloc: args.mainBloc,
          defaultSelectedChallenge: args.defaultSelectedChallenge,
        ),
        fullscreenDialog: true,
      );
    },
    PreviewMultiPostPageRoute.name: (routeData) {
      final args = routeData.argsAs<PreviewMultiPostPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i49.PreviewMultiPostPage(
          createPostGxC: args.createPostGxC,
          shouldShowNextButton: args.shouldShowNextButton,
          initialIndex: args.initialIndex,
          key: args.key,
        ),
      );
    },
    UploadMultiMediaPostV1Route.name: (routeData) {
      final args = routeData.argsAs<UploadMultiMediaPostV1RouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i50.UploadMultiMediaPostV1(
          args.createPostGxC,
          key: args.key,
          defaultSelectedChallenge: args.defaultSelectedChallenge,
        ),
        fullscreenDialog: true,
      );
    },
    PreviewAndCropMediaPostRoute.name: (routeData) {
      final args = routeData.argsAs<PreviewAndCropMediaPostRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i51.PreviewAndCropMediaPost(
          imageOrVideoPath: args.imageOrVideoPath,
          isVideo: args.isVideo,
          isFromCamera: args.isFromCamera,
          createPostGxC: args.createPostGxC,
          key: args.key,
        ),
      );
    },
    EditTextPostV1Route.name: (routeData) {
      final args = routeData.argsAs<EditTextPostV1RouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i52.EditTextPostV1(
          createPostGxC: args.createPostGxC,
          textPostData: args.textPostData,
          key: args.key,
        ),
      );
    },
    SelectAlbumPageRoute.name: (routeData) {
      final args = routeData.argsAs<SelectAlbumPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i53.SelectAlbumPage(
          key: args.key,
          albumList: args.albumList,
        ),
      );
    },
    PostPreviewPageRoute.name: (routeData) {
      final args = routeData.argsAs<PostPreviewPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i54.PostPreviewPage(
          key: args.key,
          postData: args.postData,
          onDelete: args.onDelete,
          height: args.height,
          createPostGxC: args.createPostGxC,
          index: args.index,
        ),
      );
    },
    DraftPreviewPageRoute.name: (routeData) {
      final args = routeData.argsAs<DraftPreviewPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i55.DraftPreviewPage(
          key: args.key,
          createPostGxC: args.createPostGxC,
          draft: args.draft,
          defaultSelectedChallenge: args.defaultSelectedChallenge,
        ),
      );
    },
    CreatePostPageV2Route.name: (routeData) {
      final args = routeData.argsAs<CreatePostPageV2RouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i56.CreatePostPageV2(
          key: args.key,
          mainBloc: args.mainBloc,
          defaultSelectedChallenge: args.defaultSelectedChallenge,
        ),
      );
    },
    CreateTextPostRoute.name: (routeData) {
      final args = routeData.argsAs<CreateTextPostRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i57.CreateTextPost(
          createPostGxC: args.createPostGxC,
          isEditMode: args.isEditMode,
          editTextPostData: args.editTextPostData,
          defaultSelectedChallenge: args.defaultSelectedChallenge,
          key: args.key,
        ),
      );
    },
    EditTextPostPageRoute.name: (routeData) {
      final args = routeData.argsAs<EditTextPostPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i58.EditTextPostPage(
          createPostGxC: args.createPostGxC,
          textPostData: args.textPostData,
          key: args.key,
        ),
      );
    },
    UploadMultiMediaPostV2Route.name: (routeData) {
      final args = routeData.argsAs<UploadMultiMediaPostV2RouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i59.UploadMultiMediaPostV2(
          args.createPostGxC,
          key: args.key,
          defaultSelectedChallenge: args.defaultSelectedChallenge,
        ),
      );
    },
    SettingsPageRoute.name: (routeData) {
      final args = routeData.argsAs<SettingsPageRouteArgs>(
          orElse: () => const SettingsPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i60.SettingsPage(
          key: args.key,
          shouldShowEditProfile: args.shouldShowEditProfile,
        ),
      );
    },
    PostSettingsPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i61.PostSettingsPage(),
      );
    },
    AboutPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i62.AboutPage(),
      );
    },
    DebugMenuRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i63.DebugMenu(),
      );
    },
    TermsOfServicePageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i64.TermsOfServicePage(),
      );
    },
    PrivacyPolicyPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i65.PrivacyPolicyPage(),
      );
    },
    CommunityGuidelinesPageRoute.name: (routeData) {
      final args = routeData.argsAs<CommunityGuidelinesPageRouteArgs>(
          orElse: () => const CommunityGuidelinesPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i66.CommunityGuidelinesPage(
          key: args.key,
          reportLink: args.reportLink,
        ),
      );
    },
    ContactUsPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i67.ContactUsPage(),
      );
    },
    OnboardingInnerCircleRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i68.OnboardingInnerCircle(),
        fullscreenDialog: true,
      );
    },
    ContentPreferenceStartPageRoute.name: (routeData) {
      final args = routeData.argsAs<ContentPreferenceStartPageRouteArgs>(
          orElse: () => const ContentPreferenceStartPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i69.ContentPreferenceStartPage(
          key: args.key,
          fromSignUp: args.fromSignUp,
          removeSkipButton: args.removeSkipButton,
        ),
      );
    },
    ContentPreferenceOnboardingPageRoute.name: (routeData) {
      final args = routeData.argsAs<ContentPreferenceOnboardingPageRouteArgs>(
          orElse: () => const ContentPreferenceOnboardingPageRouteArgs());
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i70.ContentPreferenceOnboardingPage(
          key: args.key,
          shouldShowSkip: args.shouldShowSkip,
        ),
      );
    },
    ContentPreferenceFinishPageRoute.name: (routeData) {
      final args = routeData.argsAs<ContentPreferenceFinishPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i71.ContentPreferenceFinishPage(
          args.passFail,
          key: args.key,
        ),
      );
    },
    RepostsListPageRoute.name: (routeData) {
      final args = routeData.argsAs<RepostsListPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i72.RepostsListPage(
          args.parentPost,
          key: args.key,
        ),
      );
    },
    PreviewRepostPageRoute.name: (routeData) {
      final args = routeData.argsAs<PreviewRepostPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i73.PreviewRepostPage(
          args.repost,
          key: args.key,
        ),
      );
    },
    ForceUpdatePageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i74.ForceUpdatePage(),
      );
    },
    ChallengeMoreEntriesPageRoute.name: (routeData) {
      final args = routeData.argsAs<ChallengeMoreEntriesPageRouteArgs>();
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: _i75.ChallengeMoreEntriesPage(
          args.type,
          args.bloc,
          key: args.key,
        ),
      );
    },
    WalletWaitlistDashboardPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i76.WalletWaitlistDashboardPage(),
      );
    },
    WildrCoinBenefitsPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i77.WildrCoinBenefitsPage(),
      );
    },
    WaitlistJoinedSuccessPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i78.WaitlistJoinedSuccessPage(),
      );
    },
    MoreHelpPageRoute.name: (routeData) {
      return _i80.MaterialPageX<dynamic>(
        routeData: routeData,
        child: const _i79.MoreHelpPage(),
      );
    },
  };

  @override
  List<_i80.RouteConfig> get routes => [
        _i80.RouteConfig(
          ChallengesOnboardingPageRoute.name,
          path: '/challenges-onboarding-page',
        ),
        _i80.RouteConfig(
          UploadProfilePhotoPageRoute.name,
          path: '/upload-profile-photo-page',
        ),
        _i80.RouteConfig(
          CreateChallengePageRoute.name,
          path: '/create-challenge-page',
        ),
        _i80.RouteConfig(
          SingleChallengePageRoute.name,
          path: '/single-challenge-page',
        ),
        _i80.RouteConfig(
          ChallengePostEntriesPageRoute.name,
          path: '/challenge-post-entries-page',
        ),
        _i80.RouteConfig(
          WildrVerifyIntroPageRoute.name,
          path: '/wildr-verify-intro-page',
        ),
        _i80.RouteConfig(
          WildrVerifyIdentityPageRoute.name,
          path: '/wildr-verify-identity-page',
        ),
        _i80.RouteConfig(
          WildrVerifyPhotoRulesPageRoute.name,
          path: '/wildr-verify-photo-rules-page',
        ),
        _i80.RouteConfig(
          ReviewPhotoPageRoute.name,
          path: '/review-photo-page',
        ),
        _i80.RouteConfig(
          WildrVerifyFaceVerificationPageRoute.name,
          path: '/wildr-verify-face-verification-page',
        ),
        _i80.RouteConfig(
          WildrFaceVerificationCameraPageRoute.name,
          path: '/wildr-face-verification-camera-page',
        ),
        _i80.RouteConfig(
          ReviewFaceVerificationPhotoPageRoute.name,
          path: '/review-face-verification-photo-page',
        ),
        _i80.RouteConfig(
          WildrVerifiedPageRoute.name,
          path: '/wildr-verified-page',
        ),
        _i80.RouteConfig(
          EntryPageRoute.name,
          path: '/',
        ),
        _i80.RouteConfig(
          HomePageRoute.name,
          path: '/home-page',
        ),
        _i80.RouteConfig(
          LicensePageRoute.name,
          path: '/license-page',
        ),
        _i80.RouteConfig(
          NotificationsPageRoute.name,
          path: '/notifications-page',
        ),
        _i80.RouteConfig(
          LoginEmailOrPhonePageRoute.name,
          path: '/login-email-or-phone-page',
        ),
        _i80.RouteConfig(
          LoginPageRoute.name,
          path: '/login-page',
        ),
        _i80.RouteConfig(
          OnboardingV3PageRoute.name,
          path: '/onboarding-v3-page',
        ),
        _i80.RouteConfig(
          ForgotPasswordPageRoute.name,
          path: '/forgot-password-page',
        ),
        _i80.RouteConfig(
          PasswordResetLinkSentPageRoute.name,
          path: '/password-reset-link-sent-page',
        ),
        _i80.RouteConfig(
          VerificationPageRoute.name,
          path: '/verification-page',
        ),
        _i80.RouteConfig(
          WaitForEmailVerificationPageRoute.name,
          path: '/wait-for-email-verification-page',
        ),
        _i80.RouteConfig(
          AskForHandleAndSignUpPageRoute.name,
          path: '/ask-for-handle-and-sign-up-page',
        ),
        _i80.RouteConfig(
          CommentsPageRoute.name,
          path: '/comments-page',
        ),
        _i80.RouteConfig(
          RepliesPageRoute.name,
          path: '/replies-page',
        ),
        _i80.RouteConfig(
          LikesPageRoute.name,
          path: '/likes-page',
        ),
        _i80.RouteConfig(
          SinglePostPageRoute.name,
          path: '/single-post-page',
        ),
        _i80.RouteConfig(
          StrikeInfoPageRoute.name,
          path: '/strike-info-page',
        ),
        _i80.RouteConfig(
          SearchPageRoute.name,
          path: '/search-page',
        ),
        _i80.RouteConfig(
          SearchSingleTagPageRoute.name,
          path: '/search-single-tag-page',
        ),
        _i80.RouteConfig(
          ProfilePageRoute.name,
          path: '/profile-page',
        ),
        _i80.RouteConfig(
          CurrentUserProfilePageRoute.name,
          path: '/current-user-profile-page',
        ),
        _i80.RouteConfig(
          PostsFeedPageRoute.name,
          path: '/posts-feed-page',
        ),
        _i80.RouteConfig(
          UserListsPageRoute.name,
          path: '/user-lists-page',
        ),
        _i80.RouteConfig(
          EditProfilePageRoute.name,
          path: '/edit-profile-page',
        ),
        _i80.RouteConfig(
          EditHandlePageRoute.name,
          path: '/edit-handle-page',
        ),
        _i80.RouteConfig(
          EditNamePageRoute.name,
          path: '/edit-name-page',
        ),
        _i80.RouteConfig(
          EditPronounPageRoute.name,
          path: '/edit-pronoun-page',
        ),
        _i80.RouteConfig(
          EditBioPageRoute.name,
          path: '/edit-bio-page',
        ),
        _i80.RouteConfig(
          EditEmailPageRoute.name,
          path: '/edit-email-page',
        ),
        _i80.RouteConfig(
          LinkEmailPageRoute.name,
          path: '/link-email-page',
        ),
        _i80.RouteConfig(
          UnlinkEmailPageRoute.name,
          path: '/unlink-email-page',
        ),
        _i80.RouteConfig(
          ChangePasswordPageRoute.name,
          path: '/change-password-page',
        ),
        _i80.RouteConfig(
          LinkPhoneNumberPageRoute.name,
          path: '/link-phone-number-page',
        ),
        _i80.RouteConfig(
          DeleteUserPageRoute.name,
          path: '/delete-user-page',
        ),
        _i80.RouteConfig(
          ContactsPageRoute.name,
          path: '/contacts-page',
        ),
        _i80.RouteConfig(
          CreatePostPageV1Route.name,
          path: '/create-post-page-v1',
        ),
        _i80.RouteConfig(
          PreviewMultiPostPageRoute.name,
          path: '/preview-multi-post-page',
        ),
        _i80.RouteConfig(
          UploadMultiMediaPostV1Route.name,
          path: '/upload-multi-media-post-v1',
        ),
        _i80.RouteConfig(
          PreviewAndCropMediaPostRoute.name,
          path: '/preview-and-crop-media-post',
        ),
        _i80.RouteConfig(
          EditTextPostV1Route.name,
          path: '/edit-text-post-v1',
        ),
        _i80.RouteConfig(
          SelectAlbumPageRoute.name,
          path: '/select-album-page',
        ),
        _i80.RouteConfig(
          PostPreviewPageRoute.name,
          path: '/post-preview-page',
        ),
        _i80.RouteConfig(
          DraftPreviewPageRoute.name,
          path: '/draft-preview-page',
        ),
        _i80.RouteConfig(
          CreatePostPageV2Route.name,
          path: '/create-post-page-v2',
        ),
        _i80.RouteConfig(
          CreateTextPostRoute.name,
          path: '/create-text-post',
        ),
        _i80.RouteConfig(
          EditTextPostPageRoute.name,
          path: '/edit-text-post-page',
        ),
        _i80.RouteConfig(
          UploadMultiMediaPostV2Route.name,
          path: '/upload-multi-media-post-v2',
        ),
        _i80.RouteConfig(
          SettingsPageRoute.name,
          path: '/settings-page',
        ),
        _i80.RouteConfig(
          PostSettingsPageRoute.name,
          path: '/post-settings-page',
        ),
        _i80.RouteConfig(
          AboutPageRoute.name,
          path: '/about-page',
        ),
        _i80.RouteConfig(
          DebugMenuRoute.name,
          path: '/debug-menu',
        ),
        _i80.RouteConfig(
          TermsOfServicePageRoute.name,
          path: '/terms-of-service-page',
        ),
        _i80.RouteConfig(
          PrivacyPolicyPageRoute.name,
          path: '/privacy-policy-page',
        ),
        _i80.RouteConfig(
          CommunityGuidelinesPageRoute.name,
          path: '/community-guidelines-page',
        ),
        _i80.RouteConfig(
          ContactUsPageRoute.name,
          path: '/contact-us-page',
        ),
        _i80.RouteConfig(
          OnboardingInnerCircleRoute.name,
          path: '/onboarding-inner-circle',
        ),
        _i80.RouteConfig(
          ContentPreferenceStartPageRoute.name,
          path: '/content-preference-start-page',
        ),
        _i80.RouteConfig(
          ContentPreferenceOnboardingPageRoute.name,
          path: '/content-preference-onboarding-page',
        ),
        _i80.RouteConfig(
          ContentPreferenceFinishPageRoute.name,
          path: '/content-preference-finish-page',
        ),
        _i80.RouteConfig(
          RepostsListPageRoute.name,
          path: '/reposts-list-page',
        ),
        _i80.RouteConfig(
          PreviewRepostPageRoute.name,
          path: '/preview-repost-page',
        ),
        _i80.RouteConfig(
          ForceUpdatePageRoute.name,
          path: '/force-update-page',
        ),
        _i80.RouteConfig(
          ChallengeMoreEntriesPageRoute.name,
          path: '/challenge-more-entries-page',
        ),
        _i80.RouteConfig(
          ChallengesOnboardingPageRoute.name,
          path: '/challenges-onboarding-page',
        ),
        _i80.RouteConfig(
          UploadProfilePhotoPageRoute.name,
          path: '/upload-profile-photo-page',
        ),
        _i80.RouteConfig(
          WalletWaitlistDashboardPageRoute.name,
          path: '/wallet-waitlist-dashboard-page',
        ),
        _i80.RouteConfig(
          WildrCoinBenefitsPageRoute.name,
          path: '/wildr-coin-benefits-page',
        ),
        _i80.RouteConfig(
          WaitlistJoinedSuccessPageRoute.name,
          path: '/waitlist-joined-success-page',
        ),
        _i80.RouteConfig(
          MoreHelpPageRoute.name,
          path: '/more-help-page',
        ),
      ];
}

/// generated route for
/// [_i1.ChallengesOnboardingPage]
class ChallengesOnboardingPageRoute
    extends _i80.PageRouteInfo<ChallengesOnboardingPageRouteArgs> {
  ChallengesOnboardingPageRoute({
    _i16.Key? key,
    _i81.HomePageIntent? entryPointIntent,
    bool skipLoginFlow = false,
    bool showBackButton = false,
    bool isEntryPoint = true,
    bool isChallengeEducation = false,
    dynamic Function(_i81.HomePageIntent?)? entryPointCallback,
    bool isDynamicLinkRedirect = false,
  }) : super(
          ChallengesOnboardingPageRoute.name,
          path: '/challenges-onboarding-page',
          args: ChallengesOnboardingPageRouteArgs(
            key: key,
            entryPointIntent: entryPointIntent,
            skipLoginFlow: skipLoginFlow,
            showBackButton: showBackButton,
            isEntryPoint: isEntryPoint,
            isChallengeEducation: isChallengeEducation,
            entryPointCallback: entryPointCallback,
            isDynamicLinkRedirect: isDynamicLinkRedirect,
          ),
        );

  static const String name = 'ChallengesOnboardingPageRoute';
}

class ChallengesOnboardingPageRouteArgs {
  const ChallengesOnboardingPageRouteArgs({
    this.key,
    this.entryPointIntent,
    this.skipLoginFlow = false,
    this.showBackButton = false,
    this.isEntryPoint = true,
    this.isChallengeEducation = false,
    this.entryPointCallback,
    this.isDynamicLinkRedirect = false,
  });

  final _i16.Key? key;

  final _i81.HomePageIntent? entryPointIntent;

  final bool skipLoginFlow;

  final bool showBackButton;

  final bool isEntryPoint;

  final bool isChallengeEducation;

  final dynamic Function(_i81.HomePageIntent?)? entryPointCallback;

  final bool isDynamicLinkRedirect;

  @override
  String toString() {
    return 'ChallengesOnboardingPageRouteArgs{key: $key, entryPointIntent: $entryPointIntent, skipLoginFlow: $skipLoginFlow, showBackButton: $showBackButton, isEntryPoint: $isEntryPoint, isChallengeEducation: $isChallengeEducation, entryPointCallback: $entryPointCallback, isDynamicLinkRedirect: $isDynamicLinkRedirect}';
  }
}

/// generated route for
/// [_i2.UploadProfilePhotoPage]
class UploadProfilePhotoPageRoute
    extends _i80.PageRouteInfo<UploadProfilePhotoPageRouteArgs> {
  UploadProfilePhotoPageRoute({
    _i16.Key? key,
    required void Function(_i82.File) onProfilePhotoSaved,
  }) : super(
          UploadProfilePhotoPageRoute.name,
          path: '/upload-profile-photo-page',
          args: UploadProfilePhotoPageRouteArgs(
            key: key,
            onProfilePhotoSaved: onProfilePhotoSaved,
          ),
        );

  static const String name = 'UploadProfilePhotoPageRoute';
}

class UploadProfilePhotoPageRouteArgs {
  const UploadProfilePhotoPageRouteArgs({
    this.key,
    required this.onProfilePhotoSaved,
  });

  final _i16.Key? key;

  final void Function(_i82.File) onProfilePhotoSaved;

  @override
  String toString() {
    return 'UploadProfilePhotoPageRouteArgs{key: $key, onProfilePhotoSaved: $onProfilePhotoSaved}';
  }
}

/// generated route for
/// [_i3.CreateChallengePage]
class CreateChallengePageRoute extends _i80.PageRouteInfo<void> {
  const CreateChallengePageRoute()
      : super(
          CreateChallengePageRoute.name,
          path: '/create-challenge-page',
        );

  static const String name = 'CreateChallengePageRoute';
}

/// generated route for
/// [_i4.SingleChallengePage]
class SingleChallengePageRoute
    extends _i80.PageRouteInfo<SingleChallengePageRouteArgs> {
  SingleChallengePageRoute({
    _i16.Key? key,
    required String challengeId,
    String? commentToNavigateToId,
    String? replyToNavigateToId,
  }) : super(
          SingleChallengePageRoute.name,
          path: '/single-challenge-page',
          args: SingleChallengePageRouteArgs(
            key: key,
            challengeId: challengeId,
            commentToNavigateToId: commentToNavigateToId,
            replyToNavigateToId: replyToNavigateToId,
          ),
        );

  static const String name = 'SingleChallengePageRoute';
}

class SingleChallengePageRouteArgs {
  const SingleChallengePageRouteArgs({
    this.key,
    required this.challengeId,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
  });

  final _i16.Key? key;

  final String challengeId;

  final String? commentToNavigateToId;

  final String? replyToNavigateToId;

  @override
  String toString() {
    return 'SingleChallengePageRouteArgs{key: $key, challengeId: $challengeId, commentToNavigateToId: $commentToNavigateToId, replyToNavigateToId: $replyToNavigateToId}';
  }
}

/// generated route for
/// [_i5.ChallengePostEntriesPage]
class ChallengePostEntriesPageRoute
    extends _i80.PageRouteInfo<ChallengePostEntriesPageRouteArgs> {
  ChallengePostEntriesPageRoute({
    _i16.Key? key,
    required String challengeId,
    required String fetchPostsUserId,
    required String participantHandle,
    required _i83.SingleChallengeBloc bloc,
  }) : super(
          ChallengePostEntriesPageRoute.name,
          path: '/challenge-post-entries-page',
          args: ChallengePostEntriesPageRouteArgs(
            key: key,
            challengeId: challengeId,
            fetchPostsUserId: fetchPostsUserId,
            participantHandle: participantHandle,
            bloc: bloc,
          ),
        );

  static const String name = 'ChallengePostEntriesPageRoute';
}

class ChallengePostEntriesPageRouteArgs {
  const ChallengePostEntriesPageRouteArgs({
    this.key,
    required this.challengeId,
    required this.fetchPostsUserId,
    required this.participantHandle,
    required this.bloc,
  });

  final _i16.Key? key;

  final String challengeId;

  final String fetchPostsUserId;

  final String participantHandle;

  final _i83.SingleChallengeBloc bloc;

  @override
  String toString() {
    return 'ChallengePostEntriesPageRouteArgs{key: $key, challengeId: $challengeId, fetchPostsUserId: $fetchPostsUserId, participantHandle: $participantHandle, bloc: $bloc}';
  }
}

/// generated route for
/// [_i6.WildrVerifyIntroPage]
class WildrVerifyIntroPageRoute extends _i80.PageRouteInfo<void> {
  const WildrVerifyIntroPageRoute()
      : super(
          WildrVerifyIntroPageRoute.name,
          path: '/wildr-verify-intro-page',
        );

  static const String name = 'WildrVerifyIntroPageRoute';
}

/// generated route for
/// [_i7.WildrVerifyIdentityPage]
class WildrVerifyIdentityPageRoute extends _i80.PageRouteInfo<void> {
  const WildrVerifyIdentityPageRoute()
      : super(
          WildrVerifyIdentityPageRoute.name,
          path: '/wildr-verify-identity-page',
        );

  static const String name = 'WildrVerifyIdentityPageRoute';
}

/// generated route for
/// [_i8.WildrVerifyPhotoRulesPage]
class WildrVerifyPhotoRulesPageRoute extends _i80.PageRouteInfo<void> {
  const WildrVerifyPhotoRulesPageRoute()
      : super(
          WildrVerifyPhotoRulesPageRoute.name,
          path: '/wildr-verify-photo-rules-page',
        );

  static const String name = 'WildrVerifyPhotoRulesPageRoute';
}

/// generated route for
/// [_i9.ReviewPhotoPage]
class ReviewPhotoPageRoute
    extends _i80.PageRouteInfo<ReviewPhotoPageRouteArgs> {
  ReviewPhotoPageRoute({
    _i16.Key? key,
    required _i82.File imageFile,
  }) : super(
          ReviewPhotoPageRoute.name,
          path: '/review-photo-page',
          args: ReviewPhotoPageRouteArgs(
            key: key,
            imageFile: imageFile,
          ),
        );

  static const String name = 'ReviewPhotoPageRoute';
}

class ReviewPhotoPageRouteArgs {
  const ReviewPhotoPageRouteArgs({
    this.key,
    required this.imageFile,
  });

  final _i16.Key? key;

  final _i82.File imageFile;

  @override
  String toString() {
    return 'ReviewPhotoPageRouteArgs{key: $key, imageFile: $imageFile}';
  }
}

/// generated route for
/// [_i10.WildrVerifyFaceVerificationPage]
class WildrVerifyFaceVerificationPageRoute extends _i80.PageRouteInfo<void> {
  const WildrVerifyFaceVerificationPageRoute()
      : super(
          WildrVerifyFaceVerificationPageRoute.name,
          path: '/wildr-verify-face-verification-page',
        );

  static const String name = 'WildrVerifyFaceVerificationPageRoute';
}

/// generated route for
/// [_i11.WildrFaceVerificationCameraPage]
class WildrFaceVerificationCameraPageRoute extends _i80.PageRouteInfo<void> {
  const WildrFaceVerificationCameraPageRoute()
      : super(
          WildrFaceVerificationCameraPageRoute.name,
          path: '/wildr-face-verification-camera-page',
        );

  static const String name = 'WildrFaceVerificationCameraPageRoute';
}

/// generated route for
/// [_i12.ReviewFaceVerificationPhotoPage]
class ReviewFaceVerificationPhotoPageRoute
    extends _i80.PageRouteInfo<ReviewFaceVerificationPhotoPageRouteArgs> {
  ReviewFaceVerificationPhotoPageRoute({
    _i16.Key? key,
    required _i82.File imageFile,
  }) : super(
          ReviewFaceVerificationPhotoPageRoute.name,
          path: '/review-face-verification-photo-page',
          args: ReviewFaceVerificationPhotoPageRouteArgs(
            key: key,
            imageFile: imageFile,
          ),
        );

  static const String name = 'ReviewFaceVerificationPhotoPageRoute';
}

class ReviewFaceVerificationPhotoPageRouteArgs {
  const ReviewFaceVerificationPhotoPageRouteArgs({
    this.key,
    required this.imageFile,
  });

  final _i16.Key? key;

  final _i82.File imageFile;

  @override
  String toString() {
    return 'ReviewFaceVerificationPhotoPageRouteArgs{key: $key, imageFile: $imageFile}';
  }
}

/// generated route for
/// [_i13.WildrVerifiedPage]
class WildrVerifiedPageRoute extends _i80.PageRouteInfo<void> {
  const WildrVerifiedPageRoute()
      : super(
          WildrVerifiedPageRoute.name,
          path: '/wildr-verified-page',
        );

  static const String name = 'WildrVerifiedPageRoute';
}

/// generated route for
/// [_i14.EntryPage]
class EntryPageRoute extends _i80.PageRouteInfo<void> {
  const EntryPageRoute()
      : super(
          EntryPageRoute.name,
          path: '/',
        );

  static const String name = 'EntryPageRoute';
}

/// generated route for
/// [_i15.HomePage]
class HomePageRoute extends _i80.PageRouteInfo<HomePageRouteArgs> {
  HomePageRoute({
    _i16.Key? key,
    bool shouldRefreshFeed = false,
    _i81.HomePageIntent? intent,
  }) : super(
          HomePageRoute.name,
          path: '/home-page',
          args: HomePageRouteArgs(
            key: key,
            shouldRefreshFeed: shouldRefreshFeed,
            intent: intent,
          ),
        );

  static const String name = 'HomePageRoute';
}

class HomePageRouteArgs {
  const HomePageRouteArgs({
    this.key,
    this.shouldRefreshFeed = false,
    this.intent,
  });

  final _i16.Key? key;

  final bool shouldRefreshFeed;

  final _i81.HomePageIntent? intent;

  @override
  String toString() {
    return 'HomePageRouteArgs{key: $key, shouldRefreshFeed: $shouldRefreshFeed, intent: $intent}';
  }
}

/// generated route for
/// [_i16.LicensePage]
class LicensePageRoute extends _i80.PageRouteInfo<LicensePageRouteArgs> {
  LicensePageRoute({
    _i16.Key? key,
    String? applicationName,
    String? applicationVersion,
    _i16.Widget? applicationIcon,
    String? applicationLegalese,
  }) : super(
          LicensePageRoute.name,
          path: '/license-page',
          args: LicensePageRouteArgs(
            key: key,
            applicationName: applicationName,
            applicationVersion: applicationVersion,
            applicationIcon: applicationIcon,
            applicationLegalese: applicationLegalese,
          ),
        );

  static const String name = 'LicensePageRoute';
}

class LicensePageRouteArgs {
  const LicensePageRouteArgs({
    this.key,
    this.applicationName,
    this.applicationVersion,
    this.applicationIcon,
    this.applicationLegalese,
  });

  final _i16.Key? key;

  final String? applicationName;

  final String? applicationVersion;

  final _i16.Widget? applicationIcon;

  final String? applicationLegalese;

  @override
  String toString() {
    return 'LicensePageRouteArgs{key: $key, applicationName: $applicationName, applicationVersion: $applicationVersion, applicationIcon: $applicationIcon, applicationLegalese: $applicationLegalese}';
  }
}

/// generated route for
/// [_i17.NotificationsPage]
class NotificationsPageRoute extends _i80.PageRouteInfo<void> {
  const NotificationsPageRoute()
      : super(
          NotificationsPageRoute.name,
          path: '/notifications-page',
        );

  static const String name = 'NotificationsPageRoute';
}

/// generated route for
/// [_i18.LoginEmailOrPhonePage]
class LoginEmailOrPhonePageRoute
    extends _i80.PageRouteInfo<LoginEmailOrPhonePageRouteArgs> {
  LoginEmailOrPhonePageRoute({
    _i16.Key? key,
    required _i16.TextEditingController phoneNumberTextEditingController,
    required _i16.TextEditingController emailTextEditingController,
    required _i16.TextEditingController passwordTextEditingController,
    required void Function() onPhoneSendVerificationCodePressed,
    required void Function() onEmailContinuePressed,
    required void Function() onEmailContinueLongPress,
  }) : super(
          LoginEmailOrPhonePageRoute.name,
          path: '/login-email-or-phone-page',
          args: LoginEmailOrPhonePageRouteArgs(
            key: key,
            phoneNumberTextEditingController: phoneNumberTextEditingController,
            emailTextEditingController: emailTextEditingController,
            passwordTextEditingController: passwordTextEditingController,
            onPhoneSendVerificationCodePressed:
                onPhoneSendVerificationCodePressed,
            onEmailContinuePressed: onEmailContinuePressed,
            onEmailContinueLongPress: onEmailContinueLongPress,
          ),
        );

  static const String name = 'LoginEmailOrPhonePageRoute';
}

class LoginEmailOrPhonePageRouteArgs {
  const LoginEmailOrPhonePageRouteArgs({
    this.key,
    required this.phoneNumberTextEditingController,
    required this.emailTextEditingController,
    required this.passwordTextEditingController,
    required this.onPhoneSendVerificationCodePressed,
    required this.onEmailContinuePressed,
    required this.onEmailContinueLongPress,
  });

  final _i16.Key? key;

  final _i16.TextEditingController phoneNumberTextEditingController;

  final _i16.TextEditingController emailTextEditingController;

  final _i16.TextEditingController passwordTextEditingController;

  final void Function() onPhoneSendVerificationCodePressed;

  final void Function() onEmailContinuePressed;

  final void Function() onEmailContinueLongPress;

  @override
  String toString() {
    return 'LoginEmailOrPhonePageRouteArgs{key: $key, phoneNumberTextEditingController: $phoneNumberTextEditingController, emailTextEditingController: $emailTextEditingController, passwordTextEditingController: $passwordTextEditingController, onPhoneSendVerificationCodePressed: $onPhoneSendVerificationCodePressed, onEmailContinuePressed: $onEmailContinuePressed, onEmailContinueLongPress: $onEmailContinueLongPress}';
  }
}

/// generated route for
/// [_i19.LoginPage]
class LoginPageRoute extends _i80.PageRouteInfo<LoginPageRouteArgs> {
  LoginPageRoute({
    _i16.Key? key,
    bool isOpenedUsingGet = false,
    _i84.Pronoun? pronoun,
    DateTime? birthday,
    List<_i85.ChallengeCategoryType>? categories,
    bool isSignup = false,
  }) : super(
          LoginPageRoute.name,
          path: '/login-page',
          args: LoginPageRouteArgs(
            key: key,
            isOpenedUsingGet: isOpenedUsingGet,
            pronoun: pronoun,
            birthday: birthday,
            categories: categories,
            isSignup: isSignup,
          ),
        );

  static const String name = 'LoginPageRoute';
}

class LoginPageRouteArgs {
  const LoginPageRouteArgs({
    this.key,
    this.isOpenedUsingGet = false,
    this.pronoun,
    this.birthday,
    this.categories,
    this.isSignup = false,
  });

  final _i16.Key? key;

  final bool isOpenedUsingGet;

  final _i84.Pronoun? pronoun;

  final DateTime? birthday;

  final List<_i85.ChallengeCategoryType>? categories;

  final bool isSignup;

  @override
  String toString() {
    return 'LoginPageRouteArgs{key: $key, isOpenedUsingGet: $isOpenedUsingGet, pronoun: $pronoun, birthday: $birthday, categories: $categories, isSignup: $isSignup}';
  }
}

/// generated route for
/// [_i20.OnboardingV3Page]
class OnboardingV3PageRoute
    extends _i80.PageRouteInfo<OnboardingV3PageRouteArgs> {
  OnboardingV3PageRoute({
    _i16.Key? key,
    bool isEntryPoint = false,
    void Function()? onSkipTapped,
    _i81.OnboardingPageBodyData? bodyData,
  }) : super(
          OnboardingV3PageRoute.name,
          path: '/onboarding-v3-page',
          args: OnboardingV3PageRouteArgs(
            key: key,
            isEntryPoint: isEntryPoint,
            onSkipTapped: onSkipTapped,
            bodyData: bodyData,
          ),
        );

  static const String name = 'OnboardingV3PageRoute';
}

class OnboardingV3PageRouteArgs {
  const OnboardingV3PageRouteArgs({
    this.key,
    this.isEntryPoint = false,
    this.onSkipTapped,
    this.bodyData,
  });

  final _i16.Key? key;

  final bool isEntryPoint;

  final void Function()? onSkipTapped;

  final _i81.OnboardingPageBodyData? bodyData;

  @override
  String toString() {
    return 'OnboardingV3PageRouteArgs{key: $key, isEntryPoint: $isEntryPoint, onSkipTapped: $onSkipTapped, bodyData: $bodyData}';
  }
}

/// generated route for
/// [_i21.ForgotPasswordPage]
class ForgotPasswordPageRoute extends _i80.PageRouteInfo<void> {
  const ForgotPasswordPageRoute()
      : super(
          ForgotPasswordPageRoute.name,
          path: '/forgot-password-page',
        );

  static const String name = 'ForgotPasswordPageRoute';
}

/// generated route for
/// [_i22.PasswordResetLinkSentPage]
class PasswordResetLinkSentPageRoute extends _i80.PageRouteInfo<void> {
  const PasswordResetLinkSentPageRoute()
      : super(
          PasswordResetLinkSentPageRoute.name,
          path: '/password-reset-link-sent-page',
        );

  static const String name = 'PasswordResetLinkSentPageRoute';
}

/// generated route for
/// [_i23.VerificationPage]
class VerificationPageRoute
    extends _i80.PageRouteInfo<VerificationPageRouteArgs> {
  VerificationPageRoute({
    _i16.Key? key,
    required void Function() onBackPressed,
    required void Function(String) onChanged,
    required void Function(String)? onComplete,
    required String phoneNumber,
    required dynamic Function(bool) onResendCode,
    required bool isSignUp,
  }) : super(
          VerificationPageRoute.name,
          path: '/verification-page',
          args: VerificationPageRouteArgs(
            key: key,
            onBackPressed: onBackPressed,
            onChanged: onChanged,
            onComplete: onComplete,
            phoneNumber: phoneNumber,
            onResendCode: onResendCode,
            isSignUp: isSignUp,
          ),
        );

  static const String name = 'VerificationPageRoute';
}

class VerificationPageRouteArgs {
  const VerificationPageRouteArgs({
    this.key,
    required this.onBackPressed,
    required this.onChanged,
    required this.onComplete,
    required this.phoneNumber,
    required this.onResendCode,
    required this.isSignUp,
  });

  final _i16.Key? key;

  final void Function() onBackPressed;

  final void Function(String) onChanged;

  final void Function(String)? onComplete;

  final String phoneNumber;

  final dynamic Function(bool) onResendCode;

  final bool isSignUp;

  @override
  String toString() {
    return 'VerificationPageRouteArgs{key: $key, onBackPressed: $onBackPressed, onChanged: $onChanged, onComplete: $onComplete, phoneNumber: $phoneNumber, onResendCode: $onResendCode, isSignUp: $isSignUp}';
  }
}

/// generated route for
/// [_i24.WaitForEmailVerificationPage]
class WaitForEmailVerificationPageRoute
    extends _i80.PageRouteInfo<WaitForEmailVerificationPageRouteArgs> {
  WaitForEmailVerificationPageRoute({
    _i16.Key? key,
    required bool isSignUp,
    required bool showUnlink,
    required String email,
    required _i24.EmailVerificationType type,
  }) : super(
          WaitForEmailVerificationPageRoute.name,
          path: '/wait-for-email-verification-page',
          args: WaitForEmailVerificationPageRouteArgs(
            key: key,
            isSignUp: isSignUp,
            showUnlink: showUnlink,
            email: email,
            type: type,
          ),
        );

  static const String name = 'WaitForEmailVerificationPageRoute';
}

class WaitForEmailVerificationPageRouteArgs {
  const WaitForEmailVerificationPageRouteArgs({
    this.key,
    required this.isSignUp,
    required this.showUnlink,
    required this.email,
    required this.type,
  });

  final _i16.Key? key;

  final bool isSignUp;

  final bool showUnlink;

  final String email;

  final _i24.EmailVerificationType type;

  @override
  String toString() {
    return 'WaitForEmailVerificationPageRouteArgs{key: $key, isSignUp: $isSignUp, showUnlink: $showUnlink, email: $email, type: $type}';
  }
}

/// generated route for
/// [_i25.AskForHandleAndSignUpPage]
class AskForHandleAndSignUpPageRoute
    extends _i80.PageRouteInfo<AskForHandleAndSignUpPageRouteArgs> {
  AskForHandleAndSignUpPageRoute({
    _i16.Key? key,
    required _i86.SignupAfterHandleDetails signUpDetails,
  }) : super(
          AskForHandleAndSignUpPageRoute.name,
          path: '/ask-for-handle-and-sign-up-page',
          args: AskForHandleAndSignUpPageRouteArgs(
            key: key,
            signUpDetails: signUpDetails,
          ),
        );

  static const String name = 'AskForHandleAndSignUpPageRoute';
}

class AskForHandleAndSignUpPageRouteArgs {
  const AskForHandleAndSignUpPageRouteArgs({
    this.key,
    required this.signUpDetails,
  });

  final _i16.Key? key;

  final _i86.SignupAfterHandleDetails signUpDetails;

  @override
  String toString() {
    return 'AskForHandleAndSignUpPageRouteArgs{key: $key, signUpDetails: $signUpDetails}';
  }
}

/// generated route for
/// [_i26.CommentsPage]
class CommentsPageRoute extends _i80.PageRouteInfo<CommentsPageRouteArgs> {
  CommentsPageRoute({
    _i16.Key? key,
    required _i87.ChallengeOrPost parent,
    String? commentToNavigateToId,
    String? replyToNavigateToId,
    required String parentPageId,
  }) : super(
          CommentsPageRoute.name,
          path: '/comments-page',
          args: CommentsPageRouteArgs(
            key: key,
            parent: parent,
            commentToNavigateToId: commentToNavigateToId,
            replyToNavigateToId: replyToNavigateToId,
            parentPageId: parentPageId,
          ),
        );

  static const String name = 'CommentsPageRoute';
}

class CommentsPageRouteArgs {
  const CommentsPageRouteArgs({
    this.key,
    required this.parent,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
    required this.parentPageId,
  });

  final _i16.Key? key;

  final _i87.ChallengeOrPost parent;

  final String? commentToNavigateToId;

  final String? replyToNavigateToId;

  final String parentPageId;

  @override
  String toString() {
    return 'CommentsPageRouteArgs{key: $key, parent: $parent, commentToNavigateToId: $commentToNavigateToId, replyToNavigateToId: $replyToNavigateToId, parentPageId: $parentPageId}';
  }
}

/// generated route for
/// [_i26.RepliesPage]
class RepliesPageRoute extends _i80.PageRouteInfo<RepliesPageRouteArgs> {
  RepliesPageRoute({
    required String parentPageId,
    required _i16.BoxDecoration boxDecoration,
    required _i16.InputDecoration inputDecoration,
    required _i16.EdgeInsets keyboardBasedEdgeInsets,
    required _i16.FocusNode focusNode,
    required String? canReplyStr,
    required bool showLoader,
    required String? canViewCommentsStr,
    required _i87.ChallengeOrPost parent,
    String? replyToNavigateToId,
    _i16.Key? key,
  }) : super(
          RepliesPageRoute.name,
          path: '/replies-page',
          args: RepliesPageRouteArgs(
            parentPageId: parentPageId,
            boxDecoration: boxDecoration,
            inputDecoration: inputDecoration,
            keyboardBasedEdgeInsets: keyboardBasedEdgeInsets,
            focusNode: focusNode,
            canReplyStr: canReplyStr,
            showLoader: showLoader,
            canViewCommentsStr: canViewCommentsStr,
            parent: parent,
            replyToNavigateToId: replyToNavigateToId,
            key: key,
          ),
        );

  static const String name = 'RepliesPageRoute';
}

class RepliesPageRouteArgs {
  const RepliesPageRouteArgs({
    required this.parentPageId,
    required this.boxDecoration,
    required this.inputDecoration,
    required this.keyboardBasedEdgeInsets,
    required this.focusNode,
    required this.canReplyStr,
    required this.showLoader,
    required this.canViewCommentsStr,
    required this.parent,
    this.replyToNavigateToId,
    this.key,
  });

  final String parentPageId;

  final _i16.BoxDecoration boxDecoration;

  final _i16.InputDecoration inputDecoration;

  final _i16.EdgeInsets keyboardBasedEdgeInsets;

  final _i16.FocusNode focusNode;

  final String? canReplyStr;

  final bool showLoader;

  final String? canViewCommentsStr;

  final _i87.ChallengeOrPost parent;

  final String? replyToNavigateToId;

  final _i16.Key? key;

  @override
  String toString() {
    return 'RepliesPageRouteArgs{parentPageId: $parentPageId, boxDecoration: $boxDecoration, inputDecoration: $inputDecoration, keyboardBasedEdgeInsets: $keyboardBasedEdgeInsets, focusNode: $focusNode, canReplyStr: $canReplyStr, showLoader: $showLoader, canViewCommentsStr: $canViewCommentsStr, parent: $parent, replyToNavigateToId: $replyToNavigateToId, key: $key}';
  }
}

/// generated route for
/// [_i27.LikesPage]
class LikesPageRoute extends _i80.PageRouteInfo<LikesPageRouteArgs> {
  LikesPageRoute({
    _i16.Key? key,
    required String id,
    required int likeCount,
    required _i27.LikesPageType type,
  }) : super(
          LikesPageRoute.name,
          path: '/likes-page',
          args: LikesPageRouteArgs(
            key: key,
            id: id,
            likeCount: likeCount,
            type: type,
          ),
        );

  static const String name = 'LikesPageRoute';
}

class LikesPageRouteArgs {
  const LikesPageRouteArgs({
    this.key,
    required this.id,
    required this.likeCount,
    required this.type,
  });

  final _i16.Key? key;

  final String id;

  final int likeCount;

  final _i27.LikesPageType type;

  @override
  String toString() {
    return 'LikesPageRouteArgs{key: $key, id: $id, likeCount: $likeCount, type: $type}';
  }
}

/// generated route for
/// [_i28.SinglePostPage]
class SinglePostPageRoute extends _i80.PageRouteInfo<SinglePostPageRouteArgs> {
  SinglePostPageRoute({
    required String postId,
    _i16.Key? key,
    String? commentToNavigateToId,
    String? replyToNavigateToId,
    int? postPageIndex,
  }) : super(
          SinglePostPageRoute.name,
          path: '/single-post-page',
          args: SinglePostPageRouteArgs(
            postId: postId,
            key: key,
            commentToNavigateToId: commentToNavigateToId,
            replyToNavigateToId: replyToNavigateToId,
            postPageIndex: postPageIndex,
          ),
        );

  static const String name = 'SinglePostPageRoute';
}

class SinglePostPageRouteArgs {
  const SinglePostPageRouteArgs({
    required this.postId,
    this.key,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
    this.postPageIndex,
  });

  final String postId;

  final _i16.Key? key;

  final String? commentToNavigateToId;

  final String? replyToNavigateToId;

  final int? postPageIndex;

  @override
  String toString() {
    return 'SinglePostPageRouteArgs{postId: $postId, key: $key, commentToNavigateToId: $commentToNavigateToId, replyToNavigateToId: $replyToNavigateToId, postPageIndex: $postPageIndex}';
  }
}

/// generated route for
/// [_i29.StrikeInfoPage]
class StrikeInfoPageRoute extends _i80.PageRouteInfo<StrikeInfoPageRouteArgs> {
  StrikeInfoPageRoute({
    required String reportId,
    _i16.Key? key,
  }) : super(
          StrikeInfoPageRoute.name,
          path: '/strike-info-page',
          args: StrikeInfoPageRouteArgs(
            reportId: reportId,
            key: key,
          ),
        );

  static const String name = 'StrikeInfoPageRoute';
}

class StrikeInfoPageRouteArgs {
  const StrikeInfoPageRouteArgs({
    required this.reportId,
    this.key,
  });

  final String reportId;

  final _i16.Key? key;

  @override
  String toString() {
    return 'StrikeInfoPageRouteArgs{reportId: $reportId, key: $key}';
  }
}

/// generated route for
/// [_i30.SearchPage]
class SearchPageRoute extends _i80.PageRouteInfo<SearchPageRouteArgs> {
  SearchPageRoute({
    _i16.Key? key,
    bool shouldShowBackButton = true,
    String? tagSearch,
    int? goToIndex,
  }) : super(
          SearchPageRoute.name,
          path: '/search-page',
          args: SearchPageRouteArgs(
            key: key,
            shouldShowBackButton: shouldShowBackButton,
            tagSearch: tagSearch,
            goToIndex: goToIndex,
          ),
        );

  static const String name = 'SearchPageRoute';
}

class SearchPageRouteArgs {
  const SearchPageRouteArgs({
    this.key,
    this.shouldShowBackButton = true,
    this.tagSearch,
    this.goToIndex,
  });

  final _i16.Key? key;

  final bool shouldShowBackButton;

  final String? tagSearch;

  final int? goToIndex;

  @override
  String toString() {
    return 'SearchPageRouteArgs{key: $key, shouldShowBackButton: $shouldShowBackButton, tagSearch: $tagSearch, goToIndex: $goToIndex}';
  }
}

/// generated route for
/// [_i31.SearchSingleTagPage]
class SearchSingleTagPageRoute
    extends _i80.PageRouteInfo<SearchSingleTagPageRouteArgs> {
  SearchSingleTagPageRoute({
    required String tagName,
    _i16.Key? key,
  }) : super(
          SearchSingleTagPageRoute.name,
          path: '/search-single-tag-page',
          args: SearchSingleTagPageRouteArgs(
            tagName: tagName,
            key: key,
          ),
        );

  static const String name = 'SearchSingleTagPageRoute';
}

class SearchSingleTagPageRouteArgs {
  const SearchSingleTagPageRouteArgs({
    required this.tagName,
    this.key,
  });

  final String tagName;

  final _i16.Key? key;

  @override
  String toString() {
    return 'SearchSingleTagPageRouteArgs{tagName: $tagName, key: $key}';
  }
}

/// generated route for
/// [_i32.ProfilePage]
class ProfilePageRoute extends _i80.PageRouteInfo<ProfilePageRouteArgs> {
  ProfilePageRoute({
    _i16.Key? key,
    required String idOfUserToFetch,
    _i88.WildrUser? userObj,
  }) : super(
          ProfilePageRoute.name,
          path: '/profile-page',
          args: ProfilePageRouteArgs(
            key: key,
            idOfUserToFetch: idOfUserToFetch,
            userObj: userObj,
          ),
        );

  static const String name = 'ProfilePageRoute';
}

class ProfilePageRouteArgs {
  const ProfilePageRouteArgs({
    this.key,
    required this.idOfUserToFetch,
    this.userObj,
  });

  final _i16.Key? key;

  final String idOfUserToFetch;

  final _i88.WildrUser? userObj;

  @override
  String toString() {
    return 'ProfilePageRouteArgs{key: $key, idOfUserToFetch: $idOfUserToFetch, userObj: $userObj}';
  }
}

/// generated route for
/// [_i33.CurrentUserProfilePage]
class CurrentUserProfilePageRoute
    extends _i80.PageRouteInfo<CurrentUserProfilePageRouteArgs> {
  CurrentUserProfilePageRoute({
    _i16.Key? key,
    bool shouldShowBackButtonAndRefresh = false,
  }) : super(
          CurrentUserProfilePageRoute.name,
          path: '/current-user-profile-page',
          args: CurrentUserProfilePageRouteArgs(
            key: key,
            shouldShowBackButtonAndRefresh: shouldShowBackButtonAndRefresh,
          ),
        );

  static const String name = 'CurrentUserProfilePageRoute';
}

class CurrentUserProfilePageRouteArgs {
  const CurrentUserProfilePageRouteArgs({
    this.key,
    this.shouldShowBackButtonAndRefresh = false,
  });

  final _i16.Key? key;

  final bool shouldShowBackButtonAndRefresh;

  @override
  String toString() {
    return 'CurrentUserProfilePageRouteArgs{key: $key, shouldShowBackButtonAndRefresh: $shouldShowBackButtonAndRefresh}';
  }
}

/// generated route for
/// [_i34.PostsFeedPage]
class PostsFeedPageRoute extends _i80.PageRouteInfo<PostsFeedPageRouteArgs> {
  PostsFeedPageRoute({
    required _i89.MainBloc mainBloc,
    required _i90.FeedGxC feedGxC,
    required bool canPaginate,
    required Function onRefresh,
    required Function paginate,
    required String heroTag,
    required String pageId,
    _i16.Key? key,
  }) : super(
          PostsFeedPageRoute.name,
          path: '/posts-feed-page',
          args: PostsFeedPageRouteArgs(
            mainBloc: mainBloc,
            feedGxC: feedGxC,
            canPaginate: canPaginate,
            onRefresh: onRefresh,
            paginate: paginate,
            heroTag: heroTag,
            pageId: pageId,
            key: key,
          ),
        );

  static const String name = 'PostsFeedPageRoute';
}

class PostsFeedPageRouteArgs {
  const PostsFeedPageRouteArgs({
    required this.mainBloc,
    required this.feedGxC,
    required this.canPaginate,
    required this.onRefresh,
    required this.paginate,
    required this.heroTag,
    required this.pageId,
    this.key,
  });

  final _i89.MainBloc mainBloc;

  final _i90.FeedGxC feedGxC;

  final bool canPaginate;

  final Function onRefresh;

  final Function paginate;

  final String heroTag;

  final String pageId;

  final _i16.Key? key;

  @override
  String toString() {
    return 'PostsFeedPageRouteArgs{mainBloc: $mainBloc, feedGxC: $feedGxC, canPaginate: $canPaginate, onRefresh: $onRefresh, paginate: $paginate, heroTag: $heroTag, pageId: $pageId, key: $key}';
  }
}

/// generated route for
/// [_i35.UserListsPage]
class UserListsPageRoute extends _i80.PageRouteInfo<UserListsPageRouteArgs> {
  UserListsPageRoute({
    required _i88.WildrUser user,
    required bool isCurrentUser,
    required bool isUserLoggedIn,
    required _i91.UserListType selectedUserListTypeFromPreviousPage,
    _i16.Key? key,
  }) : super(
          UserListsPageRoute.name,
          path: '/user-lists-page',
          args: UserListsPageRouteArgs(
            user: user,
            isCurrentUser: isCurrentUser,
            isUserLoggedIn: isUserLoggedIn,
            selectedUserListTypeFromPreviousPage:
                selectedUserListTypeFromPreviousPage,
            key: key,
          ),
        );

  static const String name = 'UserListsPageRoute';
}

class UserListsPageRouteArgs {
  const UserListsPageRouteArgs({
    required this.user,
    required this.isCurrentUser,
    required this.isUserLoggedIn,
    required this.selectedUserListTypeFromPreviousPage,
    this.key,
  });

  final _i88.WildrUser user;

  final bool isCurrentUser;

  final bool isUserLoggedIn;

  final _i91.UserListType selectedUserListTypeFromPreviousPage;

  final _i16.Key? key;

  @override
  String toString() {
    return 'UserListsPageRouteArgs{user: $user, isCurrentUser: $isCurrentUser, isUserLoggedIn: $isUserLoggedIn, selectedUserListTypeFromPreviousPage: $selectedUserListTypeFromPreviousPage, key: $key}';
  }
}

/// generated route for
/// [_i36.EditProfilePage]
class EditProfilePageRoute extends _i80.PageRouteInfo<void> {
  const EditProfilePageRoute()
      : super(
          EditProfilePageRoute.name,
          path: '/edit-profile-page',
        );

  static const String name = 'EditProfilePageRoute';
}

/// generated route for
/// [_i37.EditHandlePage]
class EditHandlePageRoute extends _i80.PageRouteInfo<EditHandlePageRouteArgs> {
  EditHandlePageRoute({
    required String handle,
    _i16.Key? key,
  }) : super(
          EditHandlePageRoute.name,
          path: '/edit-handle-page',
          args: EditHandlePageRouteArgs(
            handle: handle,
            key: key,
          ),
        );

  static const String name = 'EditHandlePageRoute';
}

class EditHandlePageRouteArgs {
  const EditHandlePageRouteArgs({
    required this.handle,
    this.key,
  });

  final String handle;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditHandlePageRouteArgs{handle: $handle, key: $key}';
  }
}

/// generated route for
/// [_i38.EditNamePage]
class EditNamePageRoute extends _i80.PageRouteInfo<EditNamePageRouteArgs> {
  EditNamePageRoute({
    required String name,
    _i16.Key? key,
  }) : super(
          EditNamePageRoute.name,
          path: '/edit-name-page',
          args: EditNamePageRouteArgs(
            name: name,
            key: key,
          ),
        );

  static const String name = 'EditNamePageRoute';
}

class EditNamePageRouteArgs {
  const EditNamePageRouteArgs({
    required this.name,
    this.key,
  });

  final String name;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditNamePageRouteArgs{name: $name, key: $key}';
  }
}

/// generated route for
/// [_i39.EditPronounPage]
class EditPronounPageRoute
    extends _i80.PageRouteInfo<EditPronounPageRouteArgs> {
  EditPronounPageRoute({
    required String pronoun,
    _i16.Key? key,
  }) : super(
          EditPronounPageRoute.name,
          path: '/edit-pronoun-page',
          args: EditPronounPageRouteArgs(
            pronoun: pronoun,
            key: key,
          ),
        );

  static const String name = 'EditPronounPageRoute';
}

class EditPronounPageRouteArgs {
  const EditPronounPageRouteArgs({
    required this.pronoun,
    this.key,
  });

  final String pronoun;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditPronounPageRouteArgs{pronoun: $pronoun, key: $key}';
  }
}

/// generated route for
/// [_i40.EditBioPage]
class EditBioPageRoute extends _i80.PageRouteInfo<EditBioPageRouteArgs> {
  EditBioPageRoute({
    required String bio,
    _i16.Key? key,
  }) : super(
          EditBioPageRoute.name,
          path: '/edit-bio-page',
          args: EditBioPageRouteArgs(
            bio: bio,
            key: key,
          ),
        );

  static const String name = 'EditBioPageRoute';
}

class EditBioPageRouteArgs {
  const EditBioPageRouteArgs({
    required this.bio,
    this.key,
  });

  final String bio;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditBioPageRouteArgs{bio: $bio, key: $key}';
  }
}

/// generated route for
/// [_i41.EditEmailPage]
class EditEmailPageRoute extends _i80.PageRouteInfo<EditEmailPageRouteArgs> {
  EditEmailPageRoute({
    required String email,
    _i16.Key? key,
  }) : super(
          EditEmailPageRoute.name,
          path: '/edit-email-page',
          args: EditEmailPageRouteArgs(
            email: email,
            key: key,
          ),
        );

  static const String name = 'EditEmailPageRoute';
}

class EditEmailPageRouteArgs {
  const EditEmailPageRouteArgs({
    required this.email,
    this.key,
  });

  final String email;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditEmailPageRouteArgs{email: $email, key: $key}';
  }
}

/// generated route for
/// [_i42.LinkEmailPage]
class LinkEmailPageRoute extends _i80.PageRouteInfo<void> {
  const LinkEmailPageRoute()
      : super(
          LinkEmailPageRoute.name,
          path: '/link-email-page',
        );

  static const String name = 'LinkEmailPageRoute';
}

/// generated route for
/// [_i43.UnlinkEmailPage]
class UnlinkEmailPageRoute extends _i80.PageRouteInfo<void> {
  const UnlinkEmailPageRoute()
      : super(
          UnlinkEmailPageRoute.name,
          path: '/unlink-email-page',
        );

  static const String name = 'UnlinkEmailPageRoute';
}

/// generated route for
/// [_i44.ChangePasswordPage]
class ChangePasswordPageRoute extends _i80.PageRouteInfo<void> {
  const ChangePasswordPageRoute()
      : super(
          ChangePasswordPageRoute.name,
          path: '/change-password-page',
        );

  static const String name = 'ChangePasswordPageRoute';
}

/// generated route for
/// [_i45.LinkPhoneNumberPage]
class LinkPhoneNumberPageRoute
    extends _i80.PageRouteInfo<LinkPhoneNumberPageRouteArgs> {
  LinkPhoneNumberPageRoute({
    _i16.Key? key,
    bool unlink = false,
  }) : super(
          LinkPhoneNumberPageRoute.name,
          path: '/link-phone-number-page',
          args: LinkPhoneNumberPageRouteArgs(
            key: key,
            unlink: unlink,
          ),
        );

  static const String name = 'LinkPhoneNumberPageRoute';
}

class LinkPhoneNumberPageRouteArgs {
  const LinkPhoneNumberPageRouteArgs({
    this.key,
    this.unlink = false,
  });

  final _i16.Key? key;

  final bool unlink;

  @override
  String toString() {
    return 'LinkPhoneNumberPageRouteArgs{key: $key, unlink: $unlink}';
  }
}

/// generated route for
/// [_i46.DeleteUserPage]
class DeleteUserPageRoute extends _i80.PageRouteInfo<void> {
  const DeleteUserPageRoute()
      : super(
          DeleteUserPageRoute.name,
          path: '/delete-user-page',
        );

  static const String name = 'DeleteUserPageRoute';
}

/// generated route for
/// [_i47.ContactsPage]
class ContactsPageRoute extends _i80.PageRouteInfo<ContactsPageRouteArgs> {
  ContactsPageRoute({
    required _i91.UserListType userListType,
    _i16.Key? key,
  }) : super(
          ContactsPageRoute.name,
          path: '/contacts-page',
          args: ContactsPageRouteArgs(
            userListType: userListType,
            key: key,
          ),
        );

  static const String name = 'ContactsPageRoute';
}

class ContactsPageRouteArgs {
  const ContactsPageRouteArgs({
    required this.userListType,
    this.key,
  });

  final _i91.UserListType userListType;

  final _i16.Key? key;

  @override
  String toString() {
    return 'ContactsPageRouteArgs{userListType: $userListType, key: $key}';
  }
}

/// generated route for
/// [_i48.CreatePostPageV1]
class CreatePostPageV1Route
    extends _i80.PageRouteInfo<CreatePostPageV1RouteArgs> {
  CreatePostPageV1Route({
    _i16.Key? key,
    required _i89.MainBloc mainBloc,
    _i92.Challenge? defaultSelectedChallenge,
  }) : super(
          CreatePostPageV1Route.name,
          path: '/create-post-page-v1',
          args: CreatePostPageV1RouteArgs(
            key: key,
            mainBloc: mainBloc,
            defaultSelectedChallenge: defaultSelectedChallenge,
          ),
        );

  static const String name = 'CreatePostPageV1Route';
}

class CreatePostPageV1RouteArgs {
  const CreatePostPageV1RouteArgs({
    this.key,
    required this.mainBloc,
    this.defaultSelectedChallenge,
  });

  final _i16.Key? key;

  final _i89.MainBloc mainBloc;

  final _i92.Challenge? defaultSelectedChallenge;

  @override
  String toString() {
    return 'CreatePostPageV1RouteArgs{key: $key, mainBloc: $mainBloc, defaultSelectedChallenge: $defaultSelectedChallenge}';
  }
}

/// generated route for
/// [_i49.PreviewMultiPostPage]
class PreviewMultiPostPageRoute
    extends _i80.PageRouteInfo<PreviewMultiPostPageRouteArgs> {
  PreviewMultiPostPageRoute({
    required _i93.CreatePostGxC createPostGxC,
    bool shouldShowNextButton = true,
    int initialIndex = 0,
    _i16.Key? key,
  }) : super(
          PreviewMultiPostPageRoute.name,
          path: '/preview-multi-post-page',
          args: PreviewMultiPostPageRouteArgs(
            createPostGxC: createPostGxC,
            shouldShowNextButton: shouldShowNextButton,
            initialIndex: initialIndex,
            key: key,
          ),
        );

  static const String name = 'PreviewMultiPostPageRoute';
}

class PreviewMultiPostPageRouteArgs {
  const PreviewMultiPostPageRouteArgs({
    required this.createPostGxC,
    this.shouldShowNextButton = true,
    this.initialIndex = 0,
    this.key,
  });

  final _i93.CreatePostGxC createPostGxC;

  final bool shouldShowNextButton;

  final int initialIndex;

  final _i16.Key? key;

  @override
  String toString() {
    return 'PreviewMultiPostPageRouteArgs{createPostGxC: $createPostGxC, shouldShowNextButton: $shouldShowNextButton, initialIndex: $initialIndex, key: $key}';
  }
}

/// generated route for
/// [_i50.UploadMultiMediaPostV1]
class UploadMultiMediaPostV1Route
    extends _i80.PageRouteInfo<UploadMultiMediaPostV1RouteArgs> {
  UploadMultiMediaPostV1Route({
    required _i93.CreatePostGxC createPostGxC,
    _i16.Key? key,
    _i92.Challenge? defaultSelectedChallenge,
  }) : super(
          UploadMultiMediaPostV1Route.name,
          path: '/upload-multi-media-post-v1',
          args: UploadMultiMediaPostV1RouteArgs(
            createPostGxC: createPostGxC,
            key: key,
            defaultSelectedChallenge: defaultSelectedChallenge,
          ),
        );

  static const String name = 'UploadMultiMediaPostV1Route';
}

class UploadMultiMediaPostV1RouteArgs {
  const UploadMultiMediaPostV1RouteArgs({
    required this.createPostGxC,
    this.key,
    this.defaultSelectedChallenge,
  });

  final _i93.CreatePostGxC createPostGxC;

  final _i16.Key? key;

  final _i92.Challenge? defaultSelectedChallenge;

  @override
  String toString() {
    return 'UploadMultiMediaPostV1RouteArgs{createPostGxC: $createPostGxC, key: $key, defaultSelectedChallenge: $defaultSelectedChallenge}';
  }
}

/// generated route for
/// [_i51.PreviewAndCropMediaPost]
class PreviewAndCropMediaPostRoute
    extends _i80.PageRouteInfo<PreviewAndCropMediaPostRouteArgs> {
  PreviewAndCropMediaPostRoute({
    required String imageOrVideoPath,
    bool isVideo = false,
    bool isFromCamera = false,
    required _i93.CreatePostGxC createPostGxC,
    _i16.Key? key,
  }) : super(
          PreviewAndCropMediaPostRoute.name,
          path: '/preview-and-crop-media-post',
          args: PreviewAndCropMediaPostRouteArgs(
            imageOrVideoPath: imageOrVideoPath,
            isVideo: isVideo,
            isFromCamera: isFromCamera,
            createPostGxC: createPostGxC,
            key: key,
          ),
        );

  static const String name = 'PreviewAndCropMediaPostRoute';
}

class PreviewAndCropMediaPostRouteArgs {
  const PreviewAndCropMediaPostRouteArgs({
    required this.imageOrVideoPath,
    this.isVideo = false,
    this.isFromCamera = false,
    required this.createPostGxC,
    this.key,
  });

  final String imageOrVideoPath;

  final bool isVideo;

  final bool isFromCamera;

  final _i93.CreatePostGxC createPostGxC;

  final _i16.Key? key;

  @override
  String toString() {
    return 'PreviewAndCropMediaPostRouteArgs{imageOrVideoPath: $imageOrVideoPath, isVideo: $isVideo, isFromCamera: $isFromCamera, createPostGxC: $createPostGxC, key: $key}';
  }
}

/// generated route for
/// [_i52.EditTextPostV1]
class EditTextPostV1Route extends _i80.PageRouteInfo<EditTextPostV1RouteArgs> {
  EditTextPostV1Route({
    required _i93.CreatePostGxC createPostGxC,
    required _i93.TextPostData textPostData,
    _i16.Key? key,
  }) : super(
          EditTextPostV1Route.name,
          path: '/edit-text-post-v1',
          args: EditTextPostV1RouteArgs(
            createPostGxC: createPostGxC,
            textPostData: textPostData,
            key: key,
          ),
        );

  static const String name = 'EditTextPostV1Route';
}

class EditTextPostV1RouteArgs {
  const EditTextPostV1RouteArgs({
    required this.createPostGxC,
    required this.textPostData,
    this.key,
  });

  final _i93.CreatePostGxC createPostGxC;

  final _i93.TextPostData textPostData;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditTextPostV1RouteArgs{createPostGxC: $createPostGxC, textPostData: $textPostData, key: $key}';
  }
}

/// generated route for
/// [_i53.SelectAlbumPage]
class SelectAlbumPageRoute
    extends _i80.PageRouteInfo<SelectAlbumPageRouteArgs> {
  SelectAlbumPageRoute({
    _i16.Key? key,
    required List<_i94.AssetPathEntity> albumList,
  }) : super(
          SelectAlbumPageRoute.name,
          path: '/select-album-page',
          args: SelectAlbumPageRouteArgs(
            key: key,
            albumList: albumList,
          ),
        );

  static const String name = 'SelectAlbumPageRoute';
}

class SelectAlbumPageRouteArgs {
  const SelectAlbumPageRouteArgs({
    this.key,
    required this.albumList,
  });

  final _i16.Key? key;

  final List<_i94.AssetPathEntity> albumList;

  @override
  String toString() {
    return 'SelectAlbumPageRouteArgs{key: $key, albumList: $albumList}';
  }
}

/// generated route for
/// [_i54.PostPreviewPage]
class PostPreviewPageRoute
    extends _i80.PageRouteInfo<PostPreviewPageRouteArgs> {
  PostPreviewPageRoute({
    _i16.Key? key,
    required _i93.PostData postData,
    required void Function() onDelete,
    required double height,
    required _i93.CreatePostGxC createPostGxC,
    required int index,
  }) : super(
          PostPreviewPageRoute.name,
          path: '/post-preview-page',
          args: PostPreviewPageRouteArgs(
            key: key,
            postData: postData,
            onDelete: onDelete,
            height: height,
            createPostGxC: createPostGxC,
            index: index,
          ),
        );

  static const String name = 'PostPreviewPageRoute';
}

class PostPreviewPageRouteArgs {
  const PostPreviewPageRouteArgs({
    this.key,
    required this.postData,
    required this.onDelete,
    required this.height,
    required this.createPostGxC,
    required this.index,
  });

  final _i16.Key? key;

  final _i93.PostData postData;

  final void Function() onDelete;

  final double height;

  final _i93.CreatePostGxC createPostGxC;

  final int index;

  @override
  String toString() {
    return 'PostPreviewPageRouteArgs{key: $key, postData: $postData, onDelete: $onDelete, height: $height, createPostGxC: $createPostGxC, index: $index}';
  }
}

/// generated route for
/// [_i55.DraftPreviewPage]
class DraftPreviewPageRoute
    extends _i80.PageRouteInfo<DraftPreviewPageRouteArgs> {
  DraftPreviewPageRoute({
    _i16.Key? key,
    required _i93.CreatePostGxC createPostGxC,
    required _i95.PostSettingsDraft draft,
    required _i92.Challenge? defaultSelectedChallenge,
  }) : super(
          DraftPreviewPageRoute.name,
          path: '/draft-preview-page',
          args: DraftPreviewPageRouteArgs(
            key: key,
            createPostGxC: createPostGxC,
            draft: draft,
            defaultSelectedChallenge: defaultSelectedChallenge,
          ),
        );

  static const String name = 'DraftPreviewPageRoute';
}

class DraftPreviewPageRouteArgs {
  const DraftPreviewPageRouteArgs({
    this.key,
    required this.createPostGxC,
    required this.draft,
    required this.defaultSelectedChallenge,
  });

  final _i16.Key? key;

  final _i93.CreatePostGxC createPostGxC;

  final _i95.PostSettingsDraft draft;

  final _i92.Challenge? defaultSelectedChallenge;

  @override
  String toString() {
    return 'DraftPreviewPageRouteArgs{key: $key, createPostGxC: $createPostGxC, draft: $draft, defaultSelectedChallenge: $defaultSelectedChallenge}';
  }
}

/// generated route for
/// [_i56.CreatePostPageV2]
class CreatePostPageV2Route
    extends _i80.PageRouteInfo<CreatePostPageV2RouteArgs> {
  CreatePostPageV2Route({
    _i16.Key? key,
    required _i89.MainBloc mainBloc,
    _i92.Challenge? defaultSelectedChallenge,
  }) : super(
          CreatePostPageV2Route.name,
          path: '/create-post-page-v2',
          args: CreatePostPageV2RouteArgs(
            key: key,
            mainBloc: mainBloc,
            defaultSelectedChallenge: defaultSelectedChallenge,
          ),
        );

  static const String name = 'CreatePostPageV2Route';
}

class CreatePostPageV2RouteArgs {
  const CreatePostPageV2RouteArgs({
    this.key,
    required this.mainBloc,
    this.defaultSelectedChallenge,
  });

  final _i16.Key? key;

  final _i89.MainBloc mainBloc;

  final _i92.Challenge? defaultSelectedChallenge;

  @override
  String toString() {
    return 'CreatePostPageV2RouteArgs{key: $key, mainBloc: $mainBloc, defaultSelectedChallenge: $defaultSelectedChallenge}';
  }
}

/// generated route for
/// [_i57.CreateTextPost]
class CreateTextPostRoute extends _i80.PageRouteInfo<CreateTextPostRouteArgs> {
  CreateTextPostRoute({
    required _i93.CreatePostGxC createPostGxC,
    bool isEditMode = false,
    _i93.TextPostData? editTextPostData,
    _i92.Challenge? defaultSelectedChallenge,
    _i16.Key? key,
  }) : super(
          CreateTextPostRoute.name,
          path: '/create-text-post',
          args: CreateTextPostRouteArgs(
            createPostGxC: createPostGxC,
            isEditMode: isEditMode,
            editTextPostData: editTextPostData,
            defaultSelectedChallenge: defaultSelectedChallenge,
            key: key,
          ),
        );

  static const String name = 'CreateTextPostRoute';
}

class CreateTextPostRouteArgs {
  const CreateTextPostRouteArgs({
    required this.createPostGxC,
    this.isEditMode = false,
    this.editTextPostData,
    this.defaultSelectedChallenge,
    this.key,
  });

  final _i93.CreatePostGxC createPostGxC;

  final bool isEditMode;

  final _i93.TextPostData? editTextPostData;

  final _i92.Challenge? defaultSelectedChallenge;

  final _i16.Key? key;

  @override
  String toString() {
    return 'CreateTextPostRouteArgs{createPostGxC: $createPostGxC, isEditMode: $isEditMode, editTextPostData: $editTextPostData, defaultSelectedChallenge: $defaultSelectedChallenge, key: $key}';
  }
}

/// generated route for
/// [_i58.EditTextPostPage]
class EditTextPostPageRoute
    extends _i80.PageRouteInfo<EditTextPostPageRouteArgs> {
  EditTextPostPageRoute({
    required _i93.CreatePostGxC createPostGxC,
    required _i93.TextPostData textPostData,
    _i16.Key? key,
  }) : super(
          EditTextPostPageRoute.name,
          path: '/edit-text-post-page',
          args: EditTextPostPageRouteArgs(
            createPostGxC: createPostGxC,
            textPostData: textPostData,
            key: key,
          ),
        );

  static const String name = 'EditTextPostPageRoute';
}

class EditTextPostPageRouteArgs {
  const EditTextPostPageRouteArgs({
    required this.createPostGxC,
    required this.textPostData,
    this.key,
  });

  final _i93.CreatePostGxC createPostGxC;

  final _i93.TextPostData textPostData;

  final _i16.Key? key;

  @override
  String toString() {
    return 'EditTextPostPageRouteArgs{createPostGxC: $createPostGxC, textPostData: $textPostData, key: $key}';
  }
}

/// generated route for
/// [_i59.UploadMultiMediaPostV2]
class UploadMultiMediaPostV2Route
    extends _i80.PageRouteInfo<UploadMultiMediaPostV2RouteArgs> {
  UploadMultiMediaPostV2Route({
    required _i93.CreatePostGxC createPostGxC,
    _i16.Key? key,
    _i92.Challenge? defaultSelectedChallenge,
  }) : super(
          UploadMultiMediaPostV2Route.name,
          path: '/upload-multi-media-post-v2',
          args: UploadMultiMediaPostV2RouteArgs(
            createPostGxC: createPostGxC,
            key: key,
            defaultSelectedChallenge: defaultSelectedChallenge,
          ),
        );

  static const String name = 'UploadMultiMediaPostV2Route';
}

class UploadMultiMediaPostV2RouteArgs {
  const UploadMultiMediaPostV2RouteArgs({
    required this.createPostGxC,
    this.key,
    this.defaultSelectedChallenge,
  });

  final _i93.CreatePostGxC createPostGxC;

  final _i16.Key? key;

  final _i92.Challenge? defaultSelectedChallenge;

  @override
  String toString() {
    return 'UploadMultiMediaPostV2RouteArgs{createPostGxC: $createPostGxC, key: $key, defaultSelectedChallenge: $defaultSelectedChallenge}';
  }
}

/// generated route for
/// [_i60.SettingsPage]
class SettingsPageRoute extends _i80.PageRouteInfo<SettingsPageRouteArgs> {
  SettingsPageRoute({
    _i16.Key? key,
    bool shouldShowEditProfile = true,
  }) : super(
          SettingsPageRoute.name,
          path: '/settings-page',
          args: SettingsPageRouteArgs(
            key: key,
            shouldShowEditProfile: shouldShowEditProfile,
          ),
        );

  static const String name = 'SettingsPageRoute';
}

class SettingsPageRouteArgs {
  const SettingsPageRouteArgs({
    this.key,
    this.shouldShowEditProfile = true,
  });

  final _i16.Key? key;

  final bool shouldShowEditProfile;

  @override
  String toString() {
    return 'SettingsPageRouteArgs{key: $key, shouldShowEditProfile: $shouldShowEditProfile}';
  }
}

/// generated route for
/// [_i61.PostSettingsPage]
class PostSettingsPageRoute extends _i80.PageRouteInfo<void> {
  const PostSettingsPageRoute()
      : super(
          PostSettingsPageRoute.name,
          path: '/post-settings-page',
        );

  static const String name = 'PostSettingsPageRoute';
}

/// generated route for
/// [_i62.AboutPage]
class AboutPageRoute extends _i80.PageRouteInfo<void> {
  const AboutPageRoute()
      : super(
          AboutPageRoute.name,
          path: '/about-page',
        );

  static const String name = 'AboutPageRoute';
}

/// generated route for
/// [_i63.DebugMenu]
class DebugMenuRoute extends _i80.PageRouteInfo<void> {
  const DebugMenuRoute()
      : super(
          DebugMenuRoute.name,
          path: '/debug-menu',
        );

  static const String name = 'DebugMenuRoute';
}

/// generated route for
/// [_i64.TermsOfServicePage]
class TermsOfServicePageRoute extends _i80.PageRouteInfo<void> {
  const TermsOfServicePageRoute()
      : super(
          TermsOfServicePageRoute.name,
          path: '/terms-of-service-page',
        );

  static const String name = 'TermsOfServicePageRoute';
}

/// generated route for
/// [_i65.PrivacyPolicyPage]
class PrivacyPolicyPageRoute extends _i80.PageRouteInfo<void> {
  const PrivacyPolicyPageRoute()
      : super(
          PrivacyPolicyPageRoute.name,
          path: '/privacy-policy-page',
        );

  static const String name = 'PrivacyPolicyPageRoute';
}

/// generated route for
/// [_i66.CommunityGuidelinesPage]
class CommunityGuidelinesPageRoute
    extends _i80.PageRouteInfo<CommunityGuidelinesPageRouteArgs> {
  CommunityGuidelinesPageRoute({
    _i16.Key? key,
    String? reportLink,
  }) : super(
          CommunityGuidelinesPageRoute.name,
          path: '/community-guidelines-page',
          args: CommunityGuidelinesPageRouteArgs(
            key: key,
            reportLink: reportLink,
          ),
        );

  static const String name = 'CommunityGuidelinesPageRoute';
}

class CommunityGuidelinesPageRouteArgs {
  const CommunityGuidelinesPageRouteArgs({
    this.key,
    this.reportLink,
  });

  final _i16.Key? key;

  final String? reportLink;

  @override
  String toString() {
    return 'CommunityGuidelinesPageRouteArgs{key: $key, reportLink: $reportLink}';
  }
}

/// generated route for
/// [_i67.ContactUsPage]
class ContactUsPageRoute extends _i80.PageRouteInfo<void> {
  const ContactUsPageRoute()
      : super(
          ContactUsPageRoute.name,
          path: '/contact-us-page',
        );

  static const String name = 'ContactUsPageRoute';
}

/// generated route for
/// [_i68.OnboardingInnerCircle]
class OnboardingInnerCircleRoute extends _i80.PageRouteInfo<void> {
  const OnboardingInnerCircleRoute()
      : super(
          OnboardingInnerCircleRoute.name,
          path: '/onboarding-inner-circle',
        );

  static const String name = 'OnboardingInnerCircleRoute';
}

/// generated route for
/// [_i69.ContentPreferenceStartPage]
class ContentPreferenceStartPageRoute
    extends _i80.PageRouteInfo<ContentPreferenceStartPageRouteArgs> {
  ContentPreferenceStartPageRoute({
    _i16.Key? key,
    bool fromSignUp = false,
    bool removeSkipButton = false,
  }) : super(
          ContentPreferenceStartPageRoute.name,
          path: '/content-preference-start-page',
          args: ContentPreferenceStartPageRouteArgs(
            key: key,
            fromSignUp: fromSignUp,
            removeSkipButton: removeSkipButton,
          ),
        );

  static const String name = 'ContentPreferenceStartPageRoute';
}

class ContentPreferenceStartPageRouteArgs {
  const ContentPreferenceStartPageRouteArgs({
    this.key,
    this.fromSignUp = false,
    this.removeSkipButton = false,
  });

  final _i16.Key? key;

  final bool fromSignUp;

  final bool removeSkipButton;

  @override
  String toString() {
    return 'ContentPreferenceStartPageRouteArgs{key: $key, fromSignUp: $fromSignUp, removeSkipButton: $removeSkipButton}';
  }
}

/// generated route for
/// [_i70.ContentPreferenceOnboardingPage]
class ContentPreferenceOnboardingPageRoute
    extends _i80.PageRouteInfo<ContentPreferenceOnboardingPageRouteArgs> {
  ContentPreferenceOnboardingPageRoute({
    _i16.Key? key,
    bool shouldShowSkip = false,
  }) : super(
          ContentPreferenceOnboardingPageRoute.name,
          path: '/content-preference-onboarding-page',
          args: ContentPreferenceOnboardingPageRouteArgs(
            key: key,
            shouldShowSkip: shouldShowSkip,
          ),
        );

  static const String name = 'ContentPreferenceOnboardingPageRoute';
}

class ContentPreferenceOnboardingPageRouteArgs {
  const ContentPreferenceOnboardingPageRouteArgs({
    this.key,
    this.shouldShowSkip = false,
  });

  final _i16.Key? key;

  final bool shouldShowSkip;

  @override
  String toString() {
    return 'ContentPreferenceOnboardingPageRouteArgs{key: $key, shouldShowSkip: $shouldShowSkip}';
  }
}

/// generated route for
/// [_i71.ContentPreferenceFinishPage]
class ContentPreferenceFinishPageRoute
    extends _i80.PageRouteInfo<ContentPreferenceFinishPageRouteArgs> {
  ContentPreferenceFinishPageRoute({
    required _i96.PassFailState passFail,
    _i16.Key? key,
  }) : super(
          ContentPreferenceFinishPageRoute.name,
          path: '/content-preference-finish-page',
          args: ContentPreferenceFinishPageRouteArgs(
            passFail: passFail,
            key: key,
          ),
        );

  static const String name = 'ContentPreferenceFinishPageRoute';
}

class ContentPreferenceFinishPageRouteArgs {
  const ContentPreferenceFinishPageRouteArgs({
    required this.passFail,
    this.key,
  });

  final _i96.PassFailState passFail;

  final _i16.Key? key;

  @override
  String toString() {
    return 'ContentPreferenceFinishPageRouteArgs{passFail: $passFail, key: $key}';
  }
}

/// generated route for
/// [_i72.RepostsListPage]
class RepostsListPageRoute
    extends _i80.PageRouteInfo<RepostsListPageRouteArgs> {
  RepostsListPageRoute({
    required _i87.Post parentPost,
    _i16.Key? key,
  }) : super(
          RepostsListPageRoute.name,
          path: '/reposts-list-page',
          args: RepostsListPageRouteArgs(
            parentPost: parentPost,
            key: key,
          ),
        );

  static const String name = 'RepostsListPageRoute';
}

class RepostsListPageRouteArgs {
  const RepostsListPageRouteArgs({
    required this.parentPost,
    this.key,
  });

  final _i87.Post parentPost;

  final _i16.Key? key;

  @override
  String toString() {
    return 'RepostsListPageRouteArgs{parentPost: $parentPost, key: $key}';
  }
}

/// generated route for
/// [_i73.PreviewRepostPage]
class PreviewRepostPageRoute
    extends _i80.PageRouteInfo<PreviewRepostPageRouteArgs> {
  PreviewRepostPageRoute({
    required _i87.Post repost,
    _i16.Key? key,
  }) : super(
          PreviewRepostPageRoute.name,
          path: '/preview-repost-page',
          args: PreviewRepostPageRouteArgs(
            repost: repost,
            key: key,
          ),
        );

  static const String name = 'PreviewRepostPageRoute';
}

class PreviewRepostPageRouteArgs {
  const PreviewRepostPageRouteArgs({
    required this.repost,
    this.key,
  });

  final _i87.Post repost;

  final _i16.Key? key;

  @override
  String toString() {
    return 'PreviewRepostPageRouteArgs{repost: $repost, key: $key}';
  }
}

/// generated route for
/// [_i74.ForceUpdatePage]
class ForceUpdatePageRoute extends _i80.PageRouteInfo<void> {
  const ForceUpdatePageRoute()
      : super(
          ForceUpdatePageRoute.name,
          path: '/force-update-page',
        );

  static const String name = 'ForceUpdatePageRoute';
}

/// generated route for
/// [_i75.ChallengeMoreEntriesPage]
class ChallengeMoreEntriesPageRoute
    extends _i80.PageRouteInfo<ChallengeMoreEntriesPageRouteArgs> {
  ChallengeMoreEntriesPageRoute({
    required _i97.ChallengeConnectionType type,
    required _i83.SingleChallengeBloc bloc,
    _i16.Key? key,
  }) : super(
          ChallengeMoreEntriesPageRoute.name,
          path: '/challenge-more-entries-page',
          args: ChallengeMoreEntriesPageRouteArgs(
            type: type,
            bloc: bloc,
            key: key,
          ),
        );

  static const String name = 'ChallengeMoreEntriesPageRoute';
}

class ChallengeMoreEntriesPageRouteArgs {
  const ChallengeMoreEntriesPageRouteArgs({
    required this.type,
    required this.bloc,
    this.key,
  });

  final _i97.ChallengeConnectionType type;

  final _i83.SingleChallengeBloc bloc;

  final _i16.Key? key;

  @override
  String toString() {
    return 'ChallengeMoreEntriesPageRouteArgs{type: $type, bloc: $bloc, key: $key}';
  }
}

/// generated route for
/// [_i76.WalletWaitlistDashboardPage]
class WalletWaitlistDashboardPageRoute extends _i80.PageRouteInfo<void> {
  const WalletWaitlistDashboardPageRoute()
      : super(
          WalletWaitlistDashboardPageRoute.name,
          path: '/wallet-waitlist-dashboard-page',
        );

  static const String name = 'WalletWaitlistDashboardPageRoute';
}

/// generated route for
/// [_i77.WildrCoinBenefitsPage]
class WildrCoinBenefitsPageRoute extends _i80.PageRouteInfo<void> {
  const WildrCoinBenefitsPageRoute()
      : super(
          WildrCoinBenefitsPageRoute.name,
          path: '/wildr-coin-benefits-page',
        );

  static const String name = 'WildrCoinBenefitsPageRoute';
}

/// generated route for
/// [_i78.WaitlistJoinedSuccessPage]
class WaitlistJoinedSuccessPageRoute extends _i80.PageRouteInfo<void> {
  const WaitlistJoinedSuccessPageRoute()
      : super(
          WaitlistJoinedSuccessPageRoute.name,
          path: '/waitlist-joined-success-page',
        );

  static const String name = 'WaitlistJoinedSuccessPageRoute';
}

/// generated route for
/// [_i79.MoreHelpPage]
class MoreHelpPageRoute extends _i80.PageRouteInfo<void> {
  const MoreHelpPageRoute()
      : super(
          MoreHelpPageRoute.name,
          path: '/more-help-page',
        );

  static const String name = 'MoreHelpPageRoute';
}
