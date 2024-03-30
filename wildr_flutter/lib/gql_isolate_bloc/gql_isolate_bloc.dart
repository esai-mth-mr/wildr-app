import 'dart:async';
import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:wildr_flutter/analytics/analytics_common.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/auth/auth_headers_constants.dart';
import 'package:wildr_flutter/auth/auth_principal_provider.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/bloc/challenges_common_bloc.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_event.dart';
import 'package:wildr_flutter/feat_challenges/create/bloc/create_challenge_form_bloc.dart';
import 'package:wildr_flutter/feat_challenges/home/bloc/challenges_home_event.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_and_connections_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_post_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenges_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/get_challenges_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/config_ext/config_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/config_ext/config_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/email_verification_ext/email_verification_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/explore_feed_ext/explore_feed_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_gql_isolate_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_state_and_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_gql_isolate_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/following_page_ext/followings_page_gql_isolate_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_gql_isolate_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/interests_ext/user_interests_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/misc_ext/misc_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/onboarding_ext/onboarding_gql_isolate_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reaction_list_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reactions_list_ext/reactions_list_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_services/g_service_isolate.dart';
import 'package:wildr_flutter/gql_services/wildr_http_client_provider.dart';
import 'package:wildr_flutter/gql_services/wildr_http_gql_link.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/home/model/wildr_user_with_token.dart';
import 'package:wildr_flutter/main_common.dart';

part 'gql_isolate_event.dart';
part 'gql_isolate_state.dart';
part 'misc_ext/helpers_gql_isolate_bloc_ext.dart';

void print(dynamic message) {
  debugPrint('🟢 GraphqlIsolateBloc: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ GraphqlIsolateBloc: $message');
}

class GraphqlIsolateBloc extends IsolateBloc<MainBlocEvent, GqlIsolateState> {
  late final String serverUrl;
  final AuthPrincipalProvider authPrincipalProvider =
      AuthPrincipalProvider.instance;
  late final WildrHttpGQLLink httpGqlLink;
  late final GServiceIsolate gService;
  bool isDisconnected = false;
  bool shouldAddTraces = false;
  late String selectedFeedScopeTypeStr;

  //Home Feed
  Map<String, dynamic>? homeFeedFetchMoreVariables;
  StreamSubscription<QueryResult<dynamic>>? homeFeedStreamSubscription;
  ObservableQuery? homeFeedObservableQuery;
  FetchMore? homeFeedFetchMore;
  Refetch? homeFeedRefetch;
  int? homeFeedExpectedEdgeSize;

  //Explore Feed
  StreamSubscription<QueryResult<dynamic>>? exploreFeedStreamSubscription;
  ObservableQuery? exploreFeedObservableQuery;
  Map<String, dynamic>? exploreFeedFetchMoreVariables;
  FetchMore? exploreFeedFetchMore;
  Refetch? exploreFeedRefetch;
  int? exploreFeedExpectedEdgeSize;

  //Current user Feed
  ObservableQuery? currentUserObservableQuery;
  StreamSubscription<QueryResult>? currentUserFeedStreamSubscription;
  FetchMore? currentUserPostsFetchMore;
  Refetch? currentUserPostsRefetch;

  //Current user details
  WildrUser? currentUser;
  StreamSubscription<QueryResult>? currentLoggedInUserStreamSubscription;
  Refetch? currentUserRefetch;
  int currentUserPreviousListCount = 0;

  //Single Post Page
  final Map<String, StreamSubscription> singlePostPageStreamSubscriptions = {};

  //Profile Page Watch Queries
  final Map<String, StreamSubscription> profilePagePostsStreamSubscriptions =
      {};
  final Map<String, Refetch> profilePageRefetchFunctions = {};
  final Map<String, FetchMore> profilePageFetchMoreFunctions = {};

  //Challenge Challenge
  /// //ID Format: `challenge_id#entry_type`
  /// Check [ChallengeEntriesConnectionType]
  final Map<String, StreamSubscription> challengeEntriesStreamSubscriptions =
      {};
  final Map<String, Refetch> challengeRefetchFunctions = {};
  final Map<String, FetchMore> challengeFetchMoreFunctions = {};
  final Map<String, int> connectionsUpcomingCount = {};

  late final bool _isDebug;

  late final PackageInfo packageInfo;

  // [client] is WildrHttpClientProvider by default.
  GraphqlIsolateBloc({
    required this.serverUrl,
    required this.packageInfo,
    required Environment env,
    required this.selectedFeedScopeTypeStr,
    http.Client? client,
  }) : super(GraphqlIsolateInitial()) {
    if (env == Environment.PROD && !kDebugMode) {
      _isDebug = false;
      debugPrint = (message, {wrapWidth}) {};
    } else {
      _isDebug = true;
    }
    _initGService(client);
  }

  // [client] is WildrHttpClientProvider by default.
  void _initGService(http.Client? client) {
    httpGqlLink = getWildrHttpGQLLink(client);
    gService = GServiceIsolate(
      this,
      httpGqlLink,
      canPrintLogs: _isDebug,
    );
  }

  @override
  Future<void> close() async {
    await homeFeedStreamSubscription?.cancel();
    await exploreFeedStreamSubscription?.cancel();
    await currentUserFeedStreamSubscription?.cancel();
    await currentLoggedInUserStreamSubscription?.cancel();
    return super.close();
  }

  // [client] is WildrHttpClientProvider by default.
  WildrHttpGQLLink getWildrHttpGQLLink(http.Client? client) => WildrHttpGQLLink(
        serverUrl,
        httpClient: client ?? WildrHttpClientProvider().client,
        authPrincipalProvider: authPrincipalProvider,
        defaultHeaders: _getDefaultHeaders(),
      );

  Map<String, String> _getDefaultHeaders() => {
        kHeaderVersion: packageInfo.version,
        kHeaderBuildNumber: packageInfo.buildNumber,
        kHeaderXTzo: _offsetInHoursAndMinutes(),
      };

  String _offsetInHoursAndMinutes() {
    final Duration offset = DateTime.now().timeZoneOffset;
    String twoDigits(int n) =>
        n.abs().toString().padLeft(2, '0'); // take absolute value for padding
    final String twoDigitMinutes = twoDigits(offset.inMinutes.remainder(60));
    final String twoDigitHours = twoDigits(offset.inHours);
    return "${offset.isNegative ? '-' : ''
        '+'}$twoDigitHours:$twoDigitMinutes";
    // append '-' if offset is negative
  }

  @override
  Stream<GqlIsolateState> mapEventToState(MainBlocEvent event) async* {
    logMainBlocEvent(event);
    print('EVENT NAME ${event.runtimeType.toString()}');
    if (event is DisableGQLEvents) {
      gService.shouldReturnError = true;
      emit(DisableGQLState());
    } else if (event is EnableGQLEvents) {
      gService.shouldReturnError = false;
      emit(EnableGQLState());
    } else if (event is TokenRetrievalTakingLongerEvent) {
      emit(TokenRetrivalTakingLongerState());
    } else if (event is LogoutOnTokenRetrievalFailedEvent) {
      emit(PerformLogoutFromGqlIsolateState());
    } else if (event is RefreshFirebaseJwtToken) {
      authPrincipalProvider.updateTokenIfNeeded(event.token);
    } else if (event is ResetGServiceGqlIsolateEvent) {
      authPrincipalProvider.reset();
      gService.client.cache.store.reset();
      clearAllFeedSubscriptions();
      emit(GServiceReinitatedWithHeaderState());
    } else if (event is Request401LogoutGqlIsolateEvent) {
      emit(PerformLogoutFromGqlIsolateState());
    } else if (event is AppendUserIdToHeaderEvent) {
      authPrincipalProvider.setUserId(event.userId);
    } else if (event is UpdateHomeFeedLastSeenCursor) {
      await updateLastSeenCursor(event);
    } else if (event is UpdateNetworkEvent) {
      isDisconnected = event.isDisconnected;
      gService.isDisconnected = isDisconnected;
    } else if (event is CancelProfilePagePostsSubscriptionEvent) {
      cancelProfilePagePostsSubscription(event.id);
    } else if (event is CancelChallengeConnectionsSubscriptionEvent) {
      cancelChallengeConnectionsSubscription(
        event.challengeId,
        event.connectionType,
        userToSearchForId: event.userToSearchForId,
      );
    } else if (event is CancelChallengeAllConnectionsSubscriptionEvent) {
      cancelChallengeAllConnectionsSubscription(event.id);
    } else if (event is CancelSinglePostSubscriptionEvent) {
      cancelSinglePostPageSubscription(event.id);
    } else if (event is ClearAllFeedSubscriptionsGqlIsolateEvent) {
      clearAllFeedSubscriptions();
    } else if (event is CancelHomeFeedSubscriptionsEvent) {
      clearMainBlocFeed();
    } else if (event is PerformDebugLoginEvent) {
      await performDebugLogin(event);
    } else if (event is GetFeedEvent) {
      selectedFeedScopeTypeStr = event.scopeFilter;
      await getHomeFeed(event);
    } else if (event is PaginateHomeFeedEvent) {
      await fetchMoreHomeFeed(event);
    } else if (event is RefetchHomeFeedGqlIsolateEvent) {
      await refetchHomeFeed(feedScopeType: event.feedScopeType);
    } else if (event is ReportPostEvent) {
      await reportPost(event);
    } else if (event is CanPaginateHomeFeedEvent) {
      yield CanPaginateHomeFeedState(event.canPaginate);
    } else if (event is UpdateHomeFeedVariablesEvent) {
      updateHomeFeedVariablesAndRefetch(event);
    } else if (event is ReactOnPostEvent) {
      await reactOnPost(event);
    } else if (event is FirebaseEmailAuthEvent) {
      await loginViaFirebaseEmail(event);
    } else if (event is FirebaseLoginWithPhoneNumberEvent) {
      await loginViaFirebasePhoneNumber(event);
    } else if (event is FirebaseSignupEvent) {
      await performFirebaseSignup(event);
    } else if (event is GetOrDeleteFirebaseUserEvent) {
      await getOrDeleteFirebaseUser(event);
    } else if (event is ClearFCMTokenToServerGqlIsolateEvent) {
      await clearFCMTokenToServer();
    } else if (event is UpdateFcmTokenToServerGqlIsolateEvent) {
      final didUpdate = await updateFCMTokenToServer(event);
      yield UpdateFcmTokenGqlIsolateState(didUpdate);
    } else if (event is UpdateFcmTokenAndProceedLogoutEvent) {
      final didUpdate = await updateFCMTokenToServer(event);
      yield DeleteFCMTokenAndProceedWithLogoutState(didUpdate);
    } else if (event is RefreshCurrentUserDetailsEvent) {
      await refreshCurrentUserDetails(event);
    } else if (event is GetCurrentUserPostsEvent) {
      await getCurrentUserPosts(event);
    } else if (event is FetchMoreCurrentUserPostsGqlIsolateEvent) {
      await fetchMoreCurrentUserPosts(event);
    } else if (event is RefetchCurrentUserPostsGqlIsolateEvent) {
      await refetchCurrentUserPosts();
    } else if (event is PaginateCurrentUserActivityEvent) {
      await paginateCurrentUserActivities(event);
    } else if (event is GetTopSearchResultsEvent) {
      await searchForTopResults(event);
    } else if (event is PostsSearchEvent) {
      await searchForPosts(event);
    } else if (event is UsersSearchEvent) {
      await searchForUsers(event);
    } else if (event is TagsSearchEvent) {
      await searchForTags(event);
    } else if (event is PaginateCommentsEvent) {
      await paginateComments(event);
    } else if (event is PaginateCommentLikesEvent) {
      await paginateCommentLikes(event);
    } else if (event is AddCommentEvent) {
      await addComment(event);
    } else if (event is ReactOnCommentEvent) {
      await reactOnComment(event);
    } else if (event is PinCommentEvent) {
      await pinComment(event);
    } else if (event is PaginateRepliesEvent) {
      await paginateReplies(event);
    } else if (event is PaginateReplyLikesEvent) {
      await paginateReplyLikes(event);
    } else if (event is AddReplyEvent) {
      await addReply(event);
    } else if (event is ReactOnReplyEvent) {
      await reactOnReply(event);
    } else if (event is ReportCommentEvent) {
      await reportComment(event);
    } else if (event is ReportUserEvent) {
      await reportUser(event);
    } else if (event is ReportReplyEvent) {
      await reportReply(event);
    } else if (event is ReportPostEvent) {
      await reportPost(event);
    } else if (event is DeleteReplyEvent) {
      await deleteReply(event);
    } else if (event is DeleteCommentEvent) {
      await deleteComment(event);
    } else if (event is DeletePostEvent) {
      await deletePost(event);
    } else if (event is GetSinglePostEvent) {
      await getPost(event);
    } else if (event is UpdateUserEmailEvent) {
      await updateUserEmail(event);
    } else if (event is UpdateUserNameEvent) {
      await updateUserName(event);
    } else if (event is UpdateUserHandleEvent) {
      await updateUserHandle(event);
    } else if (event is UpdateUserPhoneNumberEvent) {
      await updateUserPhoneNumber(event);
    } else if (event is UpdateUserAvatarEvent) {
      await updateUserAvatar(event);
    } else if (event is UpdateUserPronounEvent) {
      await updateUserPronoun(event);
    } else if (event is UpdateUserBioEvent) {
      await updateUserBio(event);
    } else if (event is MentionsInputEvent) {
      await mentionInput(event);
    } else if (event is RealReactorsCountEvent) {
      await getRealReactorsCount(event);
    } else if (event is ApplaudReactorsCountEvent) {
      await getApplaudReactorsCount(event);
    } else if (event is LikeReactorsCountEvent) {
      await getLikeReactorsCount(event);
    } //TODO: Add Paginate reactors list
    else if (event is GenerateInviteCodeEvent) {
      await generateInviteCode(event);
    } else if (event is CheckPhoneNumberAccountExistsEvent) {
      await checkPhoneNumberAccountExists(event);
    } else if (event is CheckEmailEvent) {
      await checkEmail(event);
    } else if (event is CheckHandleEvent) {
      await checkHandle(event);
    } else if (event is Check3rdPartyEvent) {
      await check3rdParty(event);
    } else if (event is GetDetailsFrom3rdPartyUidEvent) {
      await getDetailsFrom3rdPartyUid(event);
    } else if (event is RequestDeleteEvent) {
      await userRequestedDelete(event);
    } else if (event is UpdateCurrentUserObjEvent) {
      print('UpdateCurrentUserEvent');
      currentUser = event.user;
    } else if (event is FetchUserDetailsEvent) {
      await fetchUserDetails(event);
    } else if (event is GetUserPostsEvent) {
      await getUserPosts(event);
    } else if (event is RefreshUserPostsEvent) {
      await refetchUserPosts(event);
    } else if (event is PaginateUserPostsEvent) {
      await fetchMoreUserPosts(event);
    } else if (event is BlockUserEvent) {
      await blockUser(event);
    } else if (event is UnblockUserEvent) {
      await unblockUser(event);
    } else if (event is CreatePostEvent) {
      await createPost(event);
    } else if (event is RepostEvent) {
      await repost(event);
    } else if (event is FollowersTabRemoveFollowerEvent) {
      await followersPageRemoveFollower(event);
    } else if (event is FollowersTabUnfollowUserEvent) {
      await followersPageUnfollowUserEventToState(event);
    } else if (event is FollowersTabFollowUserEvent) {
      await followersPageFollowUserEventToState(event);
    } else if (event is FollowingsTabFollowUserEvent) {
      await followingsPageFollowUser(event);
    } else if (event is FollowingsTabUnfollowUserEvent) {
      await followingsPageUnfollow(event);
    } else if (event is FollowersTabPaginateMembersListEvent) {
      await getFollowersList(event);
    } else if (event is FollowingsTabPaginateMembersListEvent) {
      await getFollowingsList(event);
    } else if (event is FollowUserEvent) {
      await followUser(event);
    } else if (event is UnfollowUserEvent) {
      await unfollowUser(event);
    } else if (event is ICRemoveMemberEvent) {
      await removeMemberFromInnerCircle(event);
    } else if (event is ICAddMemberEvent) {
      await addMemberToInnerCircle(event);
    } else if (event is ICPaginateMembersListEvent) {
      await paginateInnerCircle(event);
    } else if (event is PaginateRealReactorsListEvent) {
      await paginateRealReactorsList(event);
    } else if (event is PaginateApplaudReactorsListEvent) {
      await paginateApplaudReactorsList(event);
    } else if (event is PaginateLikeReactorsListEvent) {
      await paginateLikeReactorsList(event);
    } else if (event is RequestVerificationEmailEvent) {
      await requestVerificationEmail(event);
    } else if (event is UpdateUserPostTypeInterestsEvent) {
      await updateUserPostTypeInterests(event);
    } else if (event is UpdateUserCategoryInterestsEvent) {
      await updateUserCategoryInterests(event);
    } else if (event is ContentPrefOnboardingGetPostTypesEvent) {
      await getPostTypes(event);
    } else if (event is ContentPrefOnboardingGetCategoriesEvent) {
      await getPostCategories(event);
    } else if (event is FinishOnboardingEvent) {
      await finishOnboarding(event);
    } else if (event is SkipOnboardingEvent) {
      await skipOnboarding(event);
    } else if (event is CheckInviteCodeEvent) {
      await checkInviteCode(event);
    } else if (event is UpdateListVisibilityEvent) {
      await updateListVisibility(event);
    } else if (event is GetStrikeReportEvent) {
      await getStrikeReport(event);
    } else if (event is GetExploreFeedEvent) {
      getExploreFeed();
    } else if (event is UpdateExploreFeedVariablesEvent) {
      updateExploreFeedVariablesAndRefetch(event);
    } else if (event is RefetchExploreFeedEvent) {
      await refetchExploreFeed();
    } else if (event is PaginateExploreFeedEvent) {
      await fetchMoreExploreFeed(event);
    } else if (event is UpdateExploreFeedLastSeenCursorEvent) {
      await updateExploreFeedLastSeenCursor(event);
    } else if (event is PaginateRepostedPostsEvent) {
      await getRepostsFromParentPost(event);
    } else if (event is FlagCommentEvent) {
      await flagComment(event);
    } else if (event is BlockCommenterOnPostEvent) {
      await blockCommenterOnPost(event);
    } else if (event is IsEmailVerifiedEvent) {
      await isEmailVerified(event);
    } else if (event is CheckForceUpdateEvent) {
      await checkForceUpdate(event);
    } else if (event is UpdateCommentParticipationTypeEvent) {
      await updateCommentParticipationTypeEvent(event);
    } else if (event is CreateChallengeEvent) {
      await createChallenge(event);
    } else if (event is ChallengesCommonEvent) {
      await getOnboardingCategories(event);
    } else if (event is GetMyChallengesEvent) {
      await getChallenges(event);
    } else if (event is GetFeaturedChallengesEvent) {
      await getChallenges(event);
    } else if (event is GetAllChallengesEvent) {
      await getChallenges(event);
    } else if (event is CheckTroll) {
      await checkTrollDetection(event);
    } else if (event is PinChallengeEntryEvent) {
      await pinChallengeEntry(event);
    } else if (event is GetJoinedChallengesEvent) {
      await getJoinedChallenges(event);
    } else if (event is GetSingleChallengeDetailsEvent) {
      await getSingleChallenge(event);
    } else if (event is GetBannersEvent) {
      await getBanners(event);
    } else if (event is JoinWildrCoinWaitlist) {
      await joinWildrCoinWaitlist(event);
    } else if (event is IgnoreBannerEvent) {
      await ignoreBanner(event);
    } else if (event is PaginateTodayEntriesEvent) {
      await paginateChallengeConnectionWithWatchQuery(event);
    } else if (event is PaginateFeaturedEntriesEvent) {
      await paginateChallengeConnectionWithWatchQuery(event);
    } else if (event is PaginateAllEntriesEvent) {
      await paginateChallengeConnectionWithWatchQuery(event);
    } else if (event is PaginateCurrentUserEntriesEvent) {
      await paginateChallengeConnectionWithWatchQuery(event);
    } else if (event is PaginateUserEntriesEvent) {
      await paginateChallengeConnectionWithWatchQuery(event);
    } else if (event is PaginateParticipantsEvent) {
      await paginateChallengeConnection(event);
    } else if (event is PaginateLeaderboardsEvent) {
      await paginateChallengeConnection(event);
    } else if (event is JoinChallengeEvent) {
      await joinChallenge(event);
    } else if (event is LeaveChallengeEvent) {
      await leaveChallenge(event);
    } else if (event is ReportChallengeEvent) {
      await reportChallenge(event);
    } else if (event is GetChallengePinnedCommentEvent) {
      await getChallengePinnedComment(event);
    } else if (event is GetPostPinnedCommentEvent) {
      await getPostPinnedComment(event);
    } else if (event is WildrVerifyEvent) {
      await wildrVerifiedManualReview(event);
    } else if (event is GetFeatureFlagsEvent) {
      await getFlags(event);
    } else if (event is CheckTextPostTroll) {
      await checkTextPostTrollDetection(event);
    } else if (event is StartRecordingEvent) {
      emit(StartRecordingState());
    } else if (event is StopRecordingEvent) {
      emit(StopRecordingState());
    }
  }
}
