import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:share_plus/share_plus.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tiles_sliver_grid.dart';
import 'package:wildr_flutter/feat_profile/profile/animated_profile_pic.dart';
import 'package:wildr_flutter/feat_profile/profile/animated_shake_profile_pic.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/popups/profile_page_bottom_sheets.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/actions/inner_circle_actions.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/home/model/wildr_verified.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('CURRENT_USER_PROFILE_PAGE: $message');
}

class CurrentUserProfilePage extends StatefulWidget {
  final bool shouldShowBackButtonAndRefresh;

  const CurrentUserProfilePage({
    super.key,
    this.shouldShowBackButtonAndRefresh = false,
  });

  @override
  State<CurrentUserProfilePage> createState() => _CurrentUserProfilePageState();
}

class _CurrentUserProfilePageState extends State<CurrentUserProfilePage>
    with AutomaticKeepAliveClientMixin {
  late final RefreshController _refreshController;
  late final MainBloc _mainBloc = Common().mainBloc(context);

  CurrentUserProfileGxC get _profileGxC => _mainBloc.currentUserGxC;
  late final _scrollController = ScrollController();
  bool _isRequestingForInviteCode = false;
  final String _pageId = CURRENT_USER_FEED_PAGE_ID;
  bool _isRefreshingFirstTime = true;
  bool _doneWithPagination = false;
  bool _isPaginating = false;
  String? _lastUsedEndCursor;

  WildrUser get _user => _profileGxC.user;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    _refreshController = RefreshController(
      initialRefresh: widget.shouldShowBackButtonAndRefresh,
    );
    super.initState();
  }

  void _updateCurrentVisiblePost() {
    if (_profileGxC.posts.isEmpty) {
      return;
    }
    _profileGxC.updateCurrentVisiblePost();
  }

  void _onFeedUpdate(CurrentUserPaginatedPostsState state) {
    setState(() {
      _isRefreshingFirstTime = false;
      if (state.hasError) {
        return;
      }
      _user.endCursor = state.endCursor;
      print('_onFeedUpdate _profileGxC endCursor = '
          '${_profileGxC.user.endCursor} amd state ${state.endCursor}');
      _doneWithPagination = state.hasReachedEndOfTheList;
      _refreshController.loadComplete();
      _updateCurrentVisiblePost();
      _profileGxC.posts = state.posts;
      _isPaginating = false;
    });
  }

  void logAnalyticsEvents(
    String eventName,
    GenerateInviteCodeResultState state,
  ) {
    _mainBloc.logCustomEvent(
      eventName,
      {
        AnalyticsParameters.kInviteCode: state.inviteCode.toString(),
        AnalyticsParameters.kUserListType: state.userListType.toString(),
        AnalyticsParameters.kPhoneNumber: state.phoneNumber.toString(),
        AnalyticsParameters.kInviteActionName: state.action.toString(),
      },
    );
  }

  void _onGenerateInviteCodeResult(GenerateInviteCodeResultState state) {
    if (state.errorMessage != null) {
      setState(() {
        _isRequestingForInviteCode = false;
      });
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
      return;
    }
    if (state.inviteCode != null) {
      if (state.userListType == UserListType.INNER_CIRCLE) {
        logAnalyticsEvents(AnalyticsEvents.kTapInnerCircleInviteCode, state);
        _shareInviteCode(
          code: state.inviteCode!.toString(),
          title: kInviteToInnerCircle,
          hasAction: true,
        );
        return;
      }
      logAnalyticsEvents(AnalyticsEvents.kTapInviteCode, state);
      _shareInviteCode(
        code: state.inviteCode!.toString(),
        title: kInviteOnWildrMessage,
      );
    }
  }

  void _onProfileRefresh(CurrentUserProfileRefreshState state) {
    _refreshController.refreshCompleted();
    if (state.isSuccessful && Common().isLoggedIn(context)) {
      final endCursor = _user.endCursor;
      _profileGxC.user.endCursor = endCursor;
      print('Setting endCursor = $endCursor');
      _doneWithPagination = false;
    } else {
      Common().showSnackBar(
        context,
        state.errorMessage ?? kSomethingWentWrong,
        isDisplayingError: true,
      );
      _refreshController.refreshFailed();
    }
    setState(() {});
  }

  void _onNewPostCreated() {
    _onRefresh();
    return;
  }

  BlocListener _mainBlocListener() => BlocListener<MainBloc, MainState>(
        bloc: _mainBloc,
        listener: (context, state) {
          if (state is CurrentUserProfileRefreshState) {
            _onProfileRefresh(state);
          } else if (state is CurrentUserPaginatedPostsState) {
            _onFeedUpdate(state);
          } else if (state is NewPostCreatedState) {
            _onNewPostCreated();
          } else if (state is ScrollToTheTopOfCurrentUserPageState) {
            _scrollController.animateTo(
              0,
              duration: const Duration(milliseconds: 500),
              curve: Curves.ease,
            );
          } else if (state is GenerateInviteCodeResultState) {
            if (state.pageId != CURRENT_USER_PROFILE_PAGE_ID) return;
            _onGenerateInviteCodeResult(state);
          } else if (state is RefreshCurrentUserPageState) {
            _refreshController.requestRefresh(needMove: false);
          } else if (state is GoToUserListState) {
            context.pushRoute(
              UserListsPageRoute(
                user: _user,
                isCurrentUser: true,
                isUserLoggedIn: true,
                selectedUserListTypeFromPreviousPage: state.userListType,
              ),
            );
          } else if (state is AuthStateChangedState) {
            print('AuthStateChangedState');
            if (state is AppUnauthenticatedState) {
              print('UNAUTHENTICATED');
              _mainBloc.add(NavigateToTabEvent(HomeTab.FEED));
            }
            setState(() {});
          }
        },
      );

  void _onRefresh() {
    debugPrint('_onRefresh');
    _mainBloc
      ..add(RefreshCurrentUserDetailsEvent(_user.id))
      ..add(RefetchCurrentUserPostsGqlIsolateEvent());
    _lastUsedEndCursor = null;
    _doneWithPagination = false;
  }

  void _paginatePosts() {
    print('_paginatePosts...');
    if (_doneWithPagination) {
      print('Done with pagination');
      _refreshController.loadNoData();
      return;
    }
    if (_isPaginating) {
      print('is paginating');
      return;
    }
    final endCursor = _user.endCursor;
    print('endCursor $endCursor _lastUsedEndCursor = $_lastUsedEndCursor');
    if (endCursor != null &&
        endCursor.isNotEmpty &&
        _lastUsedEndCursor != endCursor) {
      print('✅✅✅ EndCursor found $endCursor');
      _lastUsedEndCursor = endCursor;
      _isPaginating = true;
      _mainBloc.add(
        FetchMoreCurrentUserPostsGqlIsolateEvent(endCursor: endCursor),
      );
    } else {
      print('EndCursor issue ${_lastUsedEndCursor == endCursor}');
      _refreshController
        ..loadComplete()
        ..loadNoData();
    }
  }

  Widget _settingsIconButton() => IconButton(
        onPressed: () {
          context.pushRoute(SettingsPageRoute());
        },
        icon: const WildrIcon(
          WildrIcons.cog_filled,
        ),
      );

  /// Widgets
  Widget _profileImage() => Stack(
        children: [
          if (_user.wildrVerifiedVerificationStatus ==
              WildrVerifiedStatus.VERIFIED)
            Center(
              child: AnimatedProfilePicFromUser(
                _user,
                key: widget.key,
              ),
            )
          else
            AnimatedShakeProfilePic(user: _user),
          Align(
            alignment: Alignment.topRight,
            child: _settingsIconButton(),
          ),
          if (widget.shouldShowBackButtonAndRefresh)
            Align(
              alignment: Alignment.topLeft,
              child: ProfilePageCommon().backButton(context),
            ),
        ],
      );

  Widget _shimmer() => ProfilePageCommon().shimmer(
        shimmerChild: ElevatedButton(
          onPressed: null,
          child: null,
          style: ElevatedButton.styleFrom(
            backgroundColor: WildrColors.textColor(),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22.0),
            ),
          ),
        ),
      );

  Widget _shimmerOrShareButton() =>
      _user.id.isEmpty ? _shimmer() : _inviteButton();

  Widget _interactiveButton(BuildContext context) => SizedBox(
        width: Get.width * 0.85,
        height: 46,
        child: _shimmerOrShareButton(),
      );

  Widget _body() => Container(
        width: Get.width,
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_user.shouldShowWildrVerifyBanner) ...[
              Common().unverifiedUserBanner(_user, context),
            ],
            const SizedBox(height: 15),
            _profileImage(),
            ProfilePageCommon().spacing(),
            ProfilePageCommon().handle(_user),
            ProfilePageCommon().spacing(),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                ProfilePageCommon().userName(_user),
                const SizedBox(width: 5),
                ProfilePageCommon().pronoun(_user),
              ],
            ),
            ProfilePageCommon().spacing(),
            if (_user.bio != null)
              _user.bio != '' ? const SizedBox(height: 10) : Container()
            else
              Container(),
            ProfilePageCommon().bio(_user),
            // PPC().spacing(),
            ProfilePageCommon().status(_user, true, true, context),
            _interactiveButton(context),
          ],
        ),
      );

  Widget _postTilesList() => PostTilesSliverGrid(
        context: context,
        userPosts: _isRefreshingFirstTime ? null : _profileGxC.posts,
        feedGxC: _profileGxC,
        pageId: _pageId,
        onTap: (heroTag, shouldPopLater) {
          context
              .pushRoute(
            PostsFeedPageRoute(
              canPaginate: _doneWithPagination,
              mainBloc: _mainBloc,
              feedGxC: _profileGxC,
              onRefresh: _onRefresh,
              // paginate: _paginatePosts,
              paginate: () {},
              heroTag: heroTag,
              pageId: _pageId,
            ),
          )
              .then(
            (value) {
              if (shouldPopLater) {
                Navigator.of(context).pop();
              }
            },
          );
        },
        onPagination: _paginatePosts,
      );

  SmartRefresher _smartRefresher() => SmartRefresher(
        key: ValueKey(_user.id),
        controller: _refreshController,
        onRefresh: _onRefresh,
        onLoading: _paginatePosts,
        scrollController: _scrollController,
        primary: false,
        enablePullUp: true,
        header: const MaterialClassicHeader(),
        footer: createEmptyPaginationFooter(
          additionalHeight: Theme.of(context).bottomAppBarTheme.height,
        ),
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverToBoxAdapter(child: _body()),
            const SliverPadding(padding: EdgeInsets.only(top: 30)),
            _postTilesList(),
            SliverPadding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).padding.bottom,
              ),
            ),
          ],
        ),
      );

  void _showLoader() {
    setState(() {
      _isRequestingForInviteCode = true;
    });
  }

  void _openShareDialog() {
    if (_isRequestingForInviteCode) return;
    ProfilePageBottomSheets(context).invite(
      inviteToWildrCallback: () {
        _showLoader();
        Common()
            .mainBloc(context)
            .add(GenerateInviteCodeEvent(pageId: CURRENT_USER_PROFILE_PAGE_ID));
      },
      inviteToInnerCircleCallback: () {
        _showLoader();
        InnerCircleActions(context)
            .generateInviteCode(pageId: CURRENT_USER_PROFILE_PAGE_ID);
      },
    );
  }

  Widget _inviteButton() => ElevatedButton(
        onPressed: _openShareDialog,
        style: ElevatedButton.styleFrom(
          backgroundColor: WildrColors.primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22.0),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: _isRequestingForInviteCode
              ? LoadingAnimationWidget.threeArchedCircle(
                  color: Colors.white,
                  size: 46,
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.add_reaction_outlined,
                      color: Colors.white,
                    ),
                    SizedBox(
                      width: 10,
                    ),
                    Text(
                      'Invite',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 17,
                      ),
                    ),
                    WildrIcon(
                      WildrIcons.chevron_down_outline,
                      color: Colors.white,
                    ),
                  ],
                ),
        ),
      );

  Widget _currentUserPageScaffoldChild() {
    if (_user.id.isEmpty) {
      return Center(
        child: TextButton(
          child: const Text(kSomethingWentWrong),
          onPressed: () {
            WildrAuth().removeFirebaseCredentials();
            _mainBloc
              ..logCustomEvent('INCORRECT_LOGIN_STATE', {})
              ..add(NavigateToTabEvent(HomeTab.FEED));
          },
        ),
      );
    }
    return Scaffold(body: _smartRefresher());
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return MultiBlocListener(
      listeners: [_mainBlocListener()],
      child: Obx(() => _currentUserPageScaffoldChild()),
    );
  }

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }

  Future<void> _shareInviteCode({
    required String code,
    required String title,
    bool? hasAction,
  }) async {
    final String link = await ProfilePageCommon().generateInviteShortDeepLink(
      context: context,
      code: code,
      title: title,
      hasAction: hasAction,
    );
    setState(() {
      _isRequestingForInviteCode = false;
    });
    await Share.share(link);
  }
}
