// ignore: import_of_legacy_library_into_null_safe
// ignore_for_file: lines_longer_than_80_chars

import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:uuid/uuid.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/dialogs/confirmation_dialog.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tiles_sliver_grid.dart';
import 'package:wildr_flutter/feat_profile/profile/animated_profile_pic.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/popups/profile_page_bottom_sheets.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/feat_profile/profile_primary_cta.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_state.dart';
import 'package:wildr_flutter/home/home_page.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('ProfilePage $message');
}

class ProfilePage extends StatefulWidget {
  final String idOfUserToFetch;
  final WildrUser? userObj;

  const ProfilePage({
    super.key,
    required this.idOfUserToFetch,
    this.userObj,
  });

  @override
  ProfilePageState createState() => ProfilePageState();
}

class ProfilePageState extends State<ProfilePage> {
  bool _isUserLoggedIn = false;
  late final String _pageId = widget.key?.toString() ??
      '${widget.idOfUserToFetch}_${const Uuid().v4()}';
  late final RefreshController _refreshController = RefreshController();
  late final MainBloc _mainBloc = Common().mainBloc(context);
  late final CurrentUserProfileGxC _userProfileFeedGxC = Get.put(
    CurrentUserProfileGxC(),
    tag: _pageId,
  )!;
  late final CurrentUserProfileGxC _currentUserFeedGxC =
      Get.find(tag: CURRENT_USER_TAG);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  bool _isPerformingAction = false;
  bool _doneWithPagination = false;
  bool _isPaginating = false;
  bool _isFetchingPostsForTheFirstTime = true;
  bool _shouldShowShimmer = true;

  WildrUser get _user => _userProfileFeedGxC.user.isEmpty()
      ? WildrUser.empty(widget.userObj)
      : _userProfileFeedGxC.user;

  set _user(WildrUser? value) =>
      _userProfileFeedGxC.user = value ?? WildrUser.empty(widget.userObj);

  @override
  void initState() {
    debugPrint('InitState');
    _isUserLoggedIn = Common().isLoggedIn(context);
    super.initState();
    _refreshDetails();
    _mainBloc.add(
      GetUserPostsEvent(idOfUser: widget.idOfUserToFetch, pageId: _pageId),
    );
    if (mounted) setState(() {});
  }

  void _reInit() {
    isPerformingAction = false;
    _onRefresh();
  }

  set isPerformingAction(bool value) {
    _isPerformingAction = value;
    setState(() {});
  }

  bool get isPerformingAction => _isPerformingAction;

  void _updateCurrentVisiblePost() {
    if (_userProfileFeedGxC.posts.isEmpty) return;
    _userProfileFeedGxC.updateCurrentVisiblePost();
  }

  Widget _profileImage() => !_user.shouldShowWildrVerifyBanner
      ? Center(child: AnimatedProfilePicFromUser(_user, key: widget.key))
      : AnimatedProfilePicFromUser(_user);

  void _performAction() {
    debugPrint('Perform Action ${_user.isInInnerCircle}');
    if (_isUserLoggedIn) {
      if (_user.hasBlocked ?? false) {
        _showUnblockDialog();
        return;
      }
      final CurrentUserContext? uc = _user.currentUserContext;
      if (uc == null) {
        Common().showSomethingWentWrong(context);
        return;
      }
      isPerformingAction = false;
      if (_user.isInInnerCircle) {
        ProfilePageBottomSheets(context, userId: _user.id).innerCircle(
          unfollowCTA: () => isPerformingAction = true,
          cbRemoveFromIC: () => isPerformingAction = true,
        );
      } else if (uc.isFollowing) {
        ProfilePageBottomSheets(context, userId: _user.id).following(
          unfollowCTA: () => isPerformingAction = true,
          addToCircleCTA: () => isPerformingAction = true,
        );
      } else {
        _mainBloc.add(FollowUserEvent(_user.id));
        isPerformingAction = true;
      }
    } else {
      Common().openLoginPage(
        context.router,
        callback: (_) {
          if (Common().isLoggedIn(context)) {
            HomePageIntentHandler().handleHomePageIntent(
              HomePageIntent(
                HomePageIntentType.USER,
                ObjectId.user(widget.idOfUserToFetch),
              ),
              _mainBloc,
              context.router,
            );
          }
        },
      );
    }
  }

  Widget _body() => Container(
        width: Get.width,
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + Get.height * 0.04,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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
              _user.bio!.isNotEmpty ? const SizedBox(height: 10) : Container()
            else
              Container(),
            ProfilePageCommon().bio(_user),
            ProfilePageCommon().spacing(),
            ProfilePageCommon().status(
              _user,
              _user.id == _currentUserFeedGxC.user.id &&
                  _currentUserFeedGxC.user.isCurrentUser,
              _isUserLoggedIn,
              context,
            ),
            ProfilePagePrimaryCTA(
              currentUserProfileGxC: _currentUserFeedGxC,
              isPerformingAction: isPerformingAction,
              performAction: _performAction,
              user: _user,
            ),
          ],
        ),
      );

  void _refreshDetails() {
    _mainBloc.add(
      FetchUserDetailsEvent(
        idOfUserToFetch: widget.idOfUserToFetch,
        pageId: _pageId,
      ),
    );
  }

  void _onRefresh() {
    debugPrint('onRefresh()');
    _refreshDetails();
    _mainBloc.add(RefreshUserPostsEvent(_pageId));
    _doneWithPagination = false;
  }

  String _lastRequestedCursor = '';

  void _paginatePosts() {
    if (_doneWithPagination) {
      debugPrint('Done with pagination');
      _refreshController.loadNoData();
      return;
    }
    if (_isPaginating) return;
    if (_user.endCursor != null &&
        _user.endCursor!.isNotEmpty &&
        _lastRequestedCursor != _user.endCursor!) {
      _isPaginating = true;
      _lastRequestedCursor = _user.endCursor!;
      _mainBloc.add(
        PaginateUserPostsEvent(
          userId: _user.id,
          pageId: _pageId,
          endCursor: _user.endCursor!,
        ),
      );
    } else {
      debugPrint('Could not find endCursor');
      _loadNoData();
      _doneWithPagination = true;
    }
  }

  void _loadNoData() {
    print('_loadNoData...');
    Common().delayIt(
      () {
        _refreshController.loadNoData();
        if (mounted) setState(() {});
      },
      millisecond: 2000,
    );
  }

  //Bloc Listeners
  void _onProfileLoadSuccessful(ProfileLoadSuccessful state) {
    if (state.user.id != widget.idOfUserToFetch) {
      debugPrint("[ProfileLoadSuccessful] ids didn't match");
      return;
    }
    _refreshController.refreshCompleted();
    final endCursor = _user.endCursor;
    _user = state.user;
    _user.endCursor = endCursor;
    if (mounted) setState(() {});
    context.loaderOverlay.hide();
  }

  void _onProfileLoadFailed(ProfileLoadFailed state) {
    context.loaderOverlay.hide();
    Common().showSnackBar(
      context,
      state.message,
      isDisplayingError: true,
    );
    _refreshController
      ..refreshFailed()
      ..loadComplete();
    setState(() {});
  }

  void _onFeedUpdate(UserPageFeedUpdateState state) {
    final isFirstTime = _isFetchingPostsForTheFirstTime;
    _isFetchingPostsForTheFirstTime = false;
    if (state.hasError) {
      _refreshController
        ..loadFailed()
        ..refreshFailed();
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
      _isPaginating = false;
      if (mounted) setState(() {});
      return;
    }
    if (isFirstTime && state.source == QueryResultSource.cache) {
      _refreshController
        ..refreshCompleted()
        ..loadComplete();
      return;
    }
    _shouldShowShimmer = false;
    _user.endCursor = state.endCursor;
    _refreshController
      ..refreshCompleted()
      ..loadComplete();
    if (_user.endCursor?.isEmpty ?? false) {
      _loadNoData();
    }
    _updateCurrentVisiblePost();
    _userProfileFeedGxC.posts = state.posts;
    _isPaginating = false;
    _userProfileFeedGxC.updateCurrentVisiblePost();
    _doneWithPagination = state.hasReachedEndOfTheList;
    debugPrint('_doneWithPagination $_doneWithPagination');
    if (mounted) {
      setState(() {});
    }
  }

  void _onUnblockUserState(UnblockUserState state) {
    if (state.isSuccessful) {
      context.loaderOverlay.hide();
      _user.hasBlocked = false;
      _user.currentUserContext?.isFollowing = false;
      _onRefresh();
    }
  }

  void _onBlockUserState(BlockUserState state) {
    if (state.isSuccessful) {
      _user.hasBlocked = true;
      context.loaderOverlay.hide();
      _onRefresh();
    } else {
      context.loaderOverlay.hide();
      Common().showSnackBar(
        context,
        kSomethingWentWrong,
        isDisplayingError: true,
      );
    }
  }

  void _onFollowCTAState(FollowCTAState state) {
    isPerformingAction = false;
    if (state.errorMessage == null) {
      _user.currentUserContext?.isFollowing = true;
      _user.userStats.followerCount++;
      _refreshDetails();
    } else {
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
    }
    setState(() {});
  }

  void _onUnfollowCTAState(UnfollowCTAState state) {
    debugPrint('_onUnfollowCTAState');
    isPerformingAction = false;
    if (state.errorMessage == null) {
      debugPrint('Is successful');
      _user.userStats.followerCount--;
      _user.currentUserContext?.isFollowing = false;
      _user.currentUserContext?.isInnerCircle = false;
      _refreshDetails();
    } else {
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
    }
    setState(() {});
  }

  void _onReportUserState(ReportUserState state) {
    if (state.isSuccessful) {
      Common()
          .showSuccessDialog(
            context,
            title: _appLocalizations.profile_userReported,
            message: reportDoneText,
          )
          .then(
            (_) => _showBlockDialog(
              descriptionPrefix:
                  _appLocalizations.profile_blockDescriptionPrefix,
            ),
          );
    } else {
      Common().showSnackBar(
        context,
        state.errorMessage ?? kSomethingWentWrong,
        isDisplayingError: true,
      );
      Navigator.pop(context);
    }
  }

  void _onGServiceReinitatedWithHeaderState(
    GServiceReinitatedWithHeaderState state,
  ) {
    _isUserLoggedIn = true;
    _reInit();
  }

  void _onInnerCircleAddMemberState(InnerCircleAddMemberState state) {
    isPerformingAction = false;
    if (state.isSuccessful) {
      _user.currentUserContext ??= CurrentUserContext();
      _user.currentUserContext?.isInnerCircle = true;
      _refreshDetails();
    } else {
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
    }
    setState(() {});
  }

  void _onInnerCircleRemoveMemberState(InnerCircleRemoveMemberState state) {
    isPerformingAction = false;
    if (state.isSuccessful) {
      _user.currentUserContext ??= CurrentUserContext();
      _user.currentUserContext?.isInnerCircle = false;
      _refreshDetails();
    } else {
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
    }
    setState(() {});
  }

  void _mainBlocListener(context, MainState state) {
    if (state is ProfileLoading) {
    } else if (state is ProfileLoadFailed) {
      if (state.pageId != _pageId) {
        print('ProfileLoadFailed PageId is not the same');
        return;
      }
      _onProfileLoadFailed(state);
    } else if (state is ProfileLoadSuccessful) {
      if (state.pageId != _pageId) {
        print('ProfileLoadSuccessful PageId is not the same');
        return;
      }
      _onProfileLoadSuccessful(state);
    } else if (state is UserPageFeedUpdateState) {
      if (state.pageId != _pageId) {
        print('UserPageFeedUpdateState PageId is not the same');
        return;
      }
      _onFeedUpdate(state);
    } else if (state is BlockUserState) {
      _onBlockUserState(state);
    } else if (state is UnblockUserState) {
      _onUnblockUserState(state);
    } else if (state is GServiceReinitatedWithHeaderState) {
      _onGServiceReinitatedWithHeaderState(state);
    } else if (state is FollowCTAState) {
      _onFollowCTAState(state);
    } else if (state is UnfollowCTAState) {
      _onUnfollowCTAState(state);
    } else if (state is ReportUserState) {
      _onReportUserState(state);
    } else if (state is InnerCircleAddMemberState) {
      _onInnerCircleAddMemberState(state);
    } else if (state is InnerCircleRemoveMemberState) {
      _onInnerCircleRemoveMemberState(state);
    } else if (state is AuthenticationSuccessfulState) {
      setState(() {
        _isUserLoggedIn = true;
        _isPerformingAction = false;
        if (Common().currentUser(context).id == widget.idOfUserToFetch) {
          _mainBloc.add(NavigateToTabEvent(HomeTab.PROFILE));
          Navigator.pop(context);
        }
      });
    } else if (state is AppUnauthenticatedState) {
      setState(() {
        _isUserLoggedIn = false;
        _isPerformingAction = false;
      });
    }
  }

  void _showBlockDialog({
    String descriptionPrefix = 'Are you sure you want to block @',
    bool fromNavigator = false,
  }) {
    showDialog(
      useRootNavigator: true,
      context: context,
      builder: (context) => CustomDialogBox(
        logo: const ErrorLogo(),
        title: _appLocalizations.profile_blockUser,
        description:
            "$descriptionPrefix${_userProfileFeedGxC.user.handle}?\n@${_userProfileFeedGxC.user.handle} won't be notified.",
        leftButtonText: _appLocalizations.comm_cap_no,
        leftButtonColor: WildrColors.errorColor,
        leftButtonOnPressed: () {
          Navigator.of(context).pop();
        },
        rightButtonText: _appLocalizations.comm_cap_yes,
        rightButtonColor: WildrColors.errorColor,
        rightButtonOnPressed: () {
          context.loaderOverlay.show();
          _mainBloc.add(
            BlockUserEvent(
              widget.idOfUserToFetch,
              pageId: _pageId,
            ),
          );
          Navigator.of(context).pop();
        },
      ),
    ).then((value) {
      if (fromNavigator) Navigator.of(context).pop();
    });
  }

  void _showUnblockDialog({bool fromNavigator = false}) {
    showDialog(
      useRootNavigator: true,
      context: context,
      builder: (context) => CustomDialogBox(
        logo: const AttentionLogo(),
        title: _appLocalizations.profile_unblockUser,
        description:
            'Are you sure you want to unblock @${_userProfileFeedGxC.user.handle} ?',
        leftButtonText: _appLocalizations.comm_cap_no,
        leftButtonColor: Colors.orange,
        leftButtonOnPressed: () {
          context.loaderOverlay.hide();
          Navigator.of(context).pop();
        },
        rightButtonText: _appLocalizations.comm_cap_yes,
        rightButtonColor: Colors.orange,
        rightButtonOnPressed: () {
          context.loaderOverlay.show();
          _mainBloc.add(
            UnblockUserEvent(
              widget.idOfUserToFetch,
              pageId: _pageId,
            ),
          );
          Navigator.of(context).pop();
        },
      ),
    ).then((value) {
      if (fromNavigator) Navigator.of(context).pop();
    });
  }

  Widget _blockUserButton() => TextButton(
        onPressed: () {
          if (_user.hasBlocked ?? false) {
            _showUnblockDialog(fromNavigator: true);
            return;
          }
          _showBlockDialog(fromNavigator: true);
        },
        child: Text(
          _user.hasBlocked ?? false
              ? _appLocalizations.profile_unblockUser
              : _appLocalizations.profile_blockUser,
          style: const TextStyle(color: Colors.red, fontSize: 18),
        ),
      );

  void _reportUser() {
    Common().showReportItBottomSheet(
      context: context,
      reportObjectType: ReportObjectTypeEnum.USER,
      reportUserCallback: (type) {
        Common()
            .mainBloc(context)
            .add(ReportUserEvent(widget.idOfUserToFetch, type));
      },
    );
  }

  Widget _reportUserButton() => TextButton(
        onPressed: _reportUser,
        child: Text(
          _appLocalizations.profile_reportUser,
          style: const TextStyle(color: Colors.red, fontSize: 18),
        ),
      );

  IconButton _menuButtonAppBar(BuildContext context) => IconButton(
        splashRadius: 0.1,
        onPressed: () {
          Common().showActionSheet(context, [
            if (_isUserLoggedIn) ...[
              _blockUserButton(),
              Common().actionSheetDivider(),
            ],
            _reportUserButton(),
          ]);
        },
        icon: WildrIcon(
          Platform.isAndroid
              ? WildrIcons.dots_vertical_filled
              : WildrIcons.dots_horizontal_filled,
        ),
      );

  Widget _posts() => PostTilesSliverGrid(
        context: context,
        userPosts: _shouldShowShimmer ? null : _userProfileFeedGxC.posts,
        feedGxC: _userProfileFeedGxC,
        pageId: _pageId,
        onTap: (heroTag, shouldPopLater) {
          context
              .pushRoute(
            PostsFeedPageRoute(
              canPaginate: _doneWithPagination,
              mainBloc: Common().mainBloc(context),
              feedGxC: _userProfileFeedGxC,
              onRefresh: _onRefresh,
              paginate: _paginatePosts,
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
        // onPagination: _paginatePosts,
        onPagination: () {},
      );

  Widget _smartRefresherBody() => CustomScrollView(
        slivers: [
          SliverPadding(
            sliver: SliverToBoxAdapter(child: _body()),
            padding: const EdgeInsets.only(bottom: 30),
          ),
          _posts(),
        ],
      );

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        bloc: _mainBloc,
        listener: _mainBlocListener,
        child: Scaffold(
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            systemOverlayStyle: Theme.of(context).brightness == Brightness.light
                ? SystemUiOverlayStyle.dark
                : SystemUiOverlayStyle.light,
            shadowColor: Colors.transparent,
            backgroundColor: Colors.transparent,
            elevation: 0,
            actions: [
              _menuButtonAppBar(context),
            ],
          ),
          body: SmartRefresher(
            controller: _refreshController,
            onRefresh: _onRefresh,
            onLoading: _paginatePosts,
            enablePullUp: true,
            footer: createEmptyPaginationFooter(),
            child: _smartRefresherBody(),
          ),
        ),
      );

  @override
  void dispose() {
    _refreshController.dispose();
    _userProfileFeedGxC.clear();
    _mainBloc.add(CancelProfilePagePostsSubscriptionEvent(_pageId));
    super.dispose();
  }
}
