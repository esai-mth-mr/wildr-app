import 'dart:math';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_svg/svg.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:share_plus/share_plus.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_events.dart';
import 'package:wildr_flutter/analytics/challenges/challenges_analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/enums/reactions_enums.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_event.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_state.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_feed/comments_or_story_button.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/post_reactions_list/reactions_list_page.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_states.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_events.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/dialogs/wildr_dialog_box.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

/// ExpandableFab
class PostHamburgerMenu extends StatefulWidget {
  final FeedGxC feedGxC;
  final String pageId;
  final bool postNotFound;

  const PostHamburgerMenu({
    super.key,
    required this.feedGxC,
    required this.pageId,
    this.postNotFound = false,
  });

  @override
  PostHamburgerMenuState createState() => PostHamburgerMenuState();
}

class PostHamburgerMenuState extends State<PostHamburgerMenu>
    with SingleTickerProviderStateMixin {
  bool isOpened = false;
  late AnimationController _animationController;
  late Animation<Color?> _buttonColor;
  late Animation<double> _animateIcon;
  late final FeedGxC _feedGxC = widget.feedGxC;
  late Post _currentPost = _feedGxC.currentPost;
  bool _isExpanded = true;
  late CurrentUserProfileGxC _currentUserGxC;
  late String _currentUserId;
  bool _isShareLoading = false;
  PostContext? previousPostContext;
  PostStats? previousPostStats;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Color get _unselectedColor => const Color(0x75424242);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      value: 1,
      duration: const Duration(milliseconds: 200),
    )..addListener(() {
        setState(() {});
      });
    _animateIcon =
        Tween<double>(begin: 0.0, end: 1.0).animate(_animationController);
    _buttonColor = ColorTween(
      begin: WildrColors.primaryColor,
      end: _unselectedColor,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(
          0.00,
          1.00,
        ),
      ),
    );
    _currentUserGxC = Get.find(tag: CURRENT_USER_TAG);
    _currentUserId = _currentUserGxC.user.id;
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void animate() {
    if (!isOpened) {
      _animationController.forward();
    } else {
      _animationController.reverse();
    }
    isOpened = !isOpened;
  }

  void _delete() {
    final MainBloc mainBloc = Common().mainBloc(context);
    Common().showDeleteDialog(
      context,
      object: _appLocalizations.challenge_cap_post,
      onYesTap: () {
        mainBloc.add(
          DeletePostEvent(_currentPost.id, _feedGxC.currentIndex),
        );
        Navigator.of(context).pop();
        context.loaderOverlay.show();
      },
    );
  }

  void _reportIt() {
    final MainBloc mainBloc = Common().mainBloc(context);
    Common().showReportItBottomSheet(
      context: context,
      reportObjectType: ReportObjectTypeEnum.POST,
      callback: (reportedType) {
        mainBloc.add(ReportPostEvent(_currentPost.id, reportedType));
        Navigator.of(context).pop();
      },
    );
  }

  Widget reportBtn() => _button(
        index: 3,
        child: FloatingActionButton(
          elevation: 0.0,
          heroTag: 'report${widget.pageId}',
          backgroundColor: Colors.deepOrange[400],
          onPressed: _reportIt,
          child: WildrIcon(
            WildrIcons.exclamation_circle_filled,
            color: Colors.white,
            size: 25.0.w,
          ),
        ),
      );

  SocialMetaTagParameters _setupSocialMediaTagParameters() {
    bool shouldGetAuthorImage = false;
    String title = '';
    String description = '';
    if (_currentPost.bodyText != null && _currentPost.bodyText!.isNotEmpty) {
      description = _currentPost.bodyText!
          .substring(0, math.min(_currentPost.bodyText!.length, 50));
    } else {
      description += 'Wildr\nwww.wildr.com';
    }
    //Get author's image if
    // 1. Post is Private
    // 2. Post is a text post (public or private)
    String imageUrlStr;
    if (_currentPost.isPrivate) {
      shouldGetAuthorImage = true;
    } else if ((_currentPost.subPosts?[0].type ?? -1) == 1) {
      shouldGetAuthorImage = true;
    }
    debugPrint('TYPE= ${_currentPost.subPosts?[0].type}');
    debugPrint('shouldGetAuthorImage $shouldGetAuthorImage');
    if (shouldGetAuthorImage) {
      if (_currentPost.author.avatarImage?.url != null) {
        imageUrlStr = _currentPost.author.avatarImage!.url!;
      } else {
        imageUrlStr = kWildrLogoUrl;
      }
    } else {
      imageUrlStr = _currentPost.subPosts?[0].thumbnail ?? '';
    }

    final String postType = _currentPost.isStory()
        ? _appLocalizations.comm_story
        : _appLocalizations.comm_post;
    title = "Checkout @${_currentPost.author.handle}'s $postType on Wildr! ✨";
    description = description.replaceAll(RegExp(' +'), ' ');
    debugPrint('title = $title');
    debugPrint('description = $description');
    debugPrint('imageUrlStr = $imageUrlStr');
    return SocialMetaTagParameters(
      title: title,
      description: description,
      imageUrl: Uri.parse(imageUrlStr),
    );
  }

  String get _fdlSource {
    if (_currentPost.parentChallenge == null) {
      return FDLParamValues.linkSourcePost;
    }
    return FDLParamValues.linkSourceChallengePost;
  }

  Future<void> _shareIt(Function updateState) async {
    if (_isShareLoading) return;
    updateState(() {
      _isShareLoading = true;
    });
    Common().mainBloc(context).logCustomEvent(
      AnalyticsEvents.kTapPostShareButton,
      {
        AnalyticsParameters.kPostId: _currentPost.id,
        AnalyticsParameters.kAuthorId: _currentPost.author.id,
      },
    );
    String link = FlavorConfig.getValue(kDynamicLinkUrl);
    link += '/';
    link += FlavorConfig.getValue(kDynamicLinkFirstSharePostPathSegment);
    link += '?';
    link += '${FDLParams.objectId}=${_currentPost.id}';
    link += '&';
    link += '${FDLParams.source}=$_fdlSource';
    link += Common().getReferrerParams(context);
    print('Link $link');
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: FlavorConfig.getValue(kDynamicLinkUrlPrefix) +
          '/' +
          FlavorConfig.getValue(kDynamicLinkFirstSharePostPathSegment),
      link: Uri.parse(link),
      androidParameters: AndroidParameters(
        packageName: FlavorConfig.getValue(kPackageName),
        minimumVersion: 0,
      ),
      iosParameters: IOSParameters(
        bundleId: FlavorConfig.getValue(kPackageName),
        minimumVersion: '0.0.1',
        appStoreId: FlavorConfig.getValue(kAppStoreId),
      ),
      socialMetaTagParameters: _setupSocialMediaTagParameters(),
    );
    final ShortDynamicLink shortDynamicLink =
        await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    await Share.share(shortDynamicLink.shortUrl.toString()).then((value) {
      updateState(() {
        _isShareLoading = false;
      });
    });
  }

  Color _countBGColor() {
    if (Get.isDarkMode) {
      if ((_currentPost.subPosts?[_feedGxC.currentSubIndex].type ?? -1) == 1) {
        return Colors.black87;
      }
    }
    return Colors.black38;
  }

  Widget _count(String count) => Container(
        width: count.isEmpty ? 0 : 30,
        height: count.isEmpty ? 0 : 15,
        // margin: EdgeInsets.only(left: 20),
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(Radius.circular(10)),
          color: _countBGColor(),
        ),
        padding: EdgeInsets.zero,
        child: Center(
          child: Text(
            count,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      );

/*  Widget _shareBtn() {
    return _button(
      child: FloatingActionButton(
        elevation: 0.0,
        heroTag: 'Share',
        backgroundColor: _unselectedColor,
        onPressed: () => _shareIt(setState),
        child: _isShareLoading
            ? const CupertinoActivityIndicator()
            : const WildrIcon(
                WildrIcons.share_filled,
                color: Colors.white,
              ),
      ),
      index: 0,
    );
  }*/

  void _doRealReaction(bool hasRealed) {
    if (!Common().isLoggedIn(context)) {
      Common().openLoginPage(context.router);
      Common().showSnackBar(
        context,
        _appLocalizations.post_loginSignUpToReact,
        isDisplayingError: true,
        millis: 2000,
      );
      return;
    }
    previousPostContext = PostContext.copy(_currentPost.postContext);
    previousPostStats = PostStats.copy(_currentPost.stats);
    if (_currentPost.postContext.hasLiked) {
      _currentPost.stats.likeCount = max(0, _currentPost.stats.likeCount - 1);
    }
    if (_currentPost.postContext.hasApplauded) {
      _currentPost.stats.applauseCount =
          max(0, _currentPost.stats.applauseCount - 1);
    }
    if (hasRealed) {
      _currentPost.stats.realCount = max(0, _currentPost.stats.realCount - 1);
    }
    _currentPost.postContext.hasRealed = !hasRealed;
    if (_currentPost.postContext.hasRealed) {
      _currentPost.postContext.hasLiked = false;
      _currentPost.postContext.hasApplauded = false;
      _currentPost.stats.realCount += 1;
    }
    Common().mainBloc(context).add(
          ReactOnPostEvent(
            _currentPost.id,
            _feedGxC.currentIndex,
            hasRealed ? ReactionsEnum.UN_REAL : ReactionsEnum.REAL,
          ),
        );
    setState(() {});
  }

  Widget realReactionBtn() {
    final int count = _currentPost.stats.realCount;
    final String realCount = count == 0
        ? ''
        : NumberFormat.compactCurrency(
            decimalDigits: 0,
            symbol: '',
          ).format(count);
    final hasRealed = _currentPost.postContext.hasRealed;
    return _button(
      isShowingCount: realCount.isNotEmpty,
      index: 4,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            elevation: 0.0,
            heroTag: 'Real${widget.pageId}',
            backgroundColor:
                hasRealed ? WildrColors.primaryColor : _unselectedColor,
            onPressed: () {
              _doRealReaction(hasRealed);
            },
            child: SvgPicture.asset('assets/icon/reaction_real.svg'),
          ),
          _count(realCount),
        ],
      ),
    );
  }

  void _doApplaudReaction(bool hasApplauded) {
    if (!Common().isLoggedIn(context)) {
      Common().openLoginPage(context.router);
      Common().showSnackBar(
        context,
        _appLocalizations.post_loginSignUpToReact,
        isDisplayingError: true,
      );
      return;
    }
    previousPostContext = PostContext.copy(_currentPost.postContext);
    previousPostStats = PostStats.copy(_currentPost.stats);
    if (_currentPost.postContext.hasLiked) {
      _currentPost.stats.likeCount = max(0, _currentPost.stats.likeCount - 1);
    }
    if (hasApplauded) {
      _currentPost.stats.applauseCount =
          max(0, _currentPost.stats.applauseCount - 1);
    }
    if (_currentPost.postContext.hasRealed) {
      _currentPost.stats.realCount = max(0, _currentPost.stats.realCount - 1);
    }

    _currentPost.postContext.hasApplauded = !hasApplauded;
    debugPrint('HAS Applauded = $hasApplauded');
    if (_currentPost.postContext.hasApplauded) {
      _currentPost.postContext.hasLiked = false;
      _currentPost.postContext.hasRealed = false;
      _currentPost.stats.applauseCount += 1;
    }
    Common().mainBloc(context).add(
          ReactOnPostEvent(
            _currentPost.id,
            _feedGxC.currentIndex,
            hasApplauded ? ReactionsEnum.UN_APPLAUD : ReactionsEnum.APPLAUD,
          ),
        );
    setState(() {});
  }

  Widget applaudReactBtn() {
    final bool hasApplauded = _currentPost.postContext.hasApplauded;
    final int count = _currentPost.stats.applauseCount;
    final String applaudCount = count == 0
        ? ''
        : NumberFormat.compactCurrency(
            decimalDigits: 0,
            symbol: '',
          ).format(count);

    return _button(
      isShowingCount: applaudCount.isNotEmpty,
      index: 3,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            elevation: 0.0,
            heroTag: 'Applaud${widget.pageId}',
            backgroundColor:
                hasApplauded ? WildrColors.yellow : _unselectedColor,
            onPressed: () {
              _doApplaudReaction(hasApplauded);
            },
            child: SvgPicture.asset('assets/icon/reaction_applaud.svg'),
          ),
          _count(applaudCount),
        ],
      ),
    );
  }

  bool _isAuthenticated(String action) {
    if (!Common().isLoggedIn(context)) {
      Common().openLoginPage(
        context.router,
        callback: (_) {
          if (widget.pageId == HOME_FEED_PAGE_ID) return;
          if (Common().isLoggedIn(context)) {
            HomePageIntentHandler().handleHomePageIntent(
              HomePageIntent(
                HomePageIntentType.POST,
                ObjectId.post(_currentPost.id),
              ),
              Common().mainBloc(context),
              context.router,
            );
          }
        },
      );
      Common().showSnackBar(
        context,
        'Please login or signup to $action',
        isDisplayingError: true,
      );
      return false;
    }
    return true;
  }

  void _repost() {
    if (widget.postNotFound) return;
    if (!_isAuthenticated('repost')) return;
    if (_currentPost.hasReposted()) {
      showDialog(
        context: context,
        builder: (context) => WildrDialogBox.icon(
          title: "You've already reposted this",
          bodyText: 'Checkout this repost in your profile',
          buttonText: 'Go to my profile',
          onPressed: () {
            Navigator.pop(context);
            final currentUser = Common().currentUser(context);
            if (currentUser.id.isNotEmpty) {
              Common().openProfilePage(
                context,
                currentUser.id,
                shouldNavigateToCurrentUser: false,
                user: currentUser,
              );
            }
          },
          icon: WildrIcons.check_filled,
          iconColor: WildrColors.primaryColor,
        ),
      );
      return;
    }

    final CreatePostGxC createPostGxC = Get.put(CreatePostGxC());
    // ignore: cascade_invocations
    createPostGxC.repost = _currentPost;
    if (_currentPost.isStory()) createPostGxC.isStory = true;
    context
        .pushRoute(UploadMultiMediaPostV1Route(createPostGxC: createPostGxC));
  }

  Widget _repostBtn() {
    final int count = _currentPost.repostMeta?.repostCount ?? 0;
    final String repostCount = count == 0
        ? ''
        : NumberFormat.compactCurrency(
            decimalDigits: 0,
            symbol: '',
          ).format(count);
    final backgroundColor = _currentPost.hasReposted()
        ? WildrColors.primaryColor
        : _unselectedColor;
    return _button(
      isShowingCount: widget.postNotFound || repostCount.isNotEmpty,
      index: 2,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            elevation: 0.0,
            heroTag: 'Repost${widget.pageId}',
            backgroundColor: backgroundColor,
            onPressed: () => _repost(),
            child: const WildrIcon(WildrIcons.repost, color: Colors.white),
          ),
          _count(widget.postNotFound ? '-' : repostCount),
        ],
      ),
    );
  }

  void _doLikeReaction(bool hasLiked, {bool disableUnlike = false}) {
    if (widget.postNotFound) return;
    if (!_isAuthenticated('react')) return;
    if (_currentPost.postContext.hasLiked && disableUnlike) return;

    previousPostContext = PostContext.copy(_currentPost.postContext);
    previousPostStats = PostStats.copy(_currentPost.stats);
    if (hasLiked) {
      _currentPost.stats.likeCount = max(0, _currentPost.stats.likeCount - 1);
    }
    if (_currentPost.postContext.hasApplauded) {
      _currentPost.stats.applauseCount =
          max(0, _currentPost.stats.applauseCount - 1);
    }
    if (_currentPost.postContext.hasRealed) {
      _currentPost.stats.realCount = max(0, _currentPost.stats.realCount - 1);
    }
    _currentPost.postContext.hasLiked = !hasLiked;
    if (_currentPost.postContext.hasLiked) {
      _currentPost.postContext.hasRealed = false;
      _currentPost.postContext.hasApplauded = false;
      _currentPost.stats.likeCount += 1;
    }
    Common().mainBloc(context).add(
          ReactOnPostEvent(
            _currentPost.id,
            _feedGxC.currentIndex,
            hasLiked ? ReactionsEnum.UN_LIKE : ReactionsEnum.LIKE,
          ),
        );
    setState(() {});
  }

  Widget _likeBtn() {
    final bool hasLiked = _currentPost.postContext.hasLiked;
    final int count = _currentPost.stats.likeCount;
    final String likeCount = count == 0
        ? ''
        : NumberFormat.compactCurrency(
            decimalDigits: 0,
            symbol: '',
          ).format(count);
    final child = _button(
      isShowingCount: widget.postNotFound || likeCount.isNotEmpty,
      index: 2,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            elevation: 0.0,
            heroTag: 'Like${widget.pageId}',
            backgroundColor: hasLiked ? WildrColors.red : _unselectedColor,
            onPressed: () => _doLikeReaction(hasLiked),
            child: const WildrIcon(
              WildrIcons.heart_outline,
              color: Colors.white,
            ),
          ),
          _count(widget.postNotFound ? '-' : likeCount),
        ],
      ),
    );
    if (_currentPost.isParentPostDeleted()) {
      return GestureDetector(
        onTap: () {
          Common().showSnackBar(
            context,
            _appLocalizations.post_noLongerReactOnThisPost,
          );
        },
        child: Opacity(
          opacity: 0.5,
          child: AbsorbPointer(
            child: child,
          ),
        ),
      );
    }
    return child;
  }

  Widget _commentStoryBtn() {
    final int count = _currentPost.stats.commentCount;
    final String commentCount = count == 0
        ? ''
        : NumberFormat.compactCurrency(
            decimalDigits: 0,
            symbol: '',
          ).format(count);
    final child = _button(
      isShowingCount: widget.postNotFound || commentCount.isNotEmpty,
      index: 2,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            elevation: 0.0,
            heroTag: 'Comments Button ${widget.pageId}',
            backgroundColor: _unselectedColor,
            onPressed: () {
              if (widget.postNotFound) return;
              if (_currentPost.isDeleted()) {
                Common().showErrorSnackBar(
                  _appLocalizations.post_postUnavailable,
                  context,
                );
                return;
              }
              if (_currentPost.id.isEmpty || _currentPost.isStory()) {
                return;
              }
              context.pushRoute(
                CommentsPageRoute(
                  parent: _feedGxC.currentPost,
                  parentPageId: widget.pageId,
                ),
              );
            },
            child: CommentsOrStoryButton(
              feedGxC: _feedGxC,
              pageId: widget.pageId,
            ),
          ),
          _count(widget.postNotFound ? '-' : commentCount),
        ],
      ),
    );
    if (_currentPost.isParentPostDeleted()) {
      return GestureDetector(
        onTap: () {
          Common().showSnackBar(
            context,
            _appLocalizations.post_noLongerCommentOnThisPost,
          );
        },
        child: Opacity(
          opacity: 0.5,
          child: AbsorbPointer(
            child: child,
          ),
        ),
      );
    }
    return child;
  }

  void _pinEntryMenu() {
    if (_feedGxC.currentPost.isPinnedToChallenge == null) return;
    final bool currentPostPinnedStatus =
        _feedGxC.currentPost.isPinnedToChallenge!;

    Common().mainBloc(context).logCustomEvent(
      currentPostPinnedStatus
          ? ChallengesAnalyticsEvents.kUnpinChallengeEntry
          : ChallengesAnalyticsEvents.kPinChallengeEntry,
      {
        ChallengesAnalyticsParameters.kChallengeId:
            _feedGxC.currentPost.parentChallenge?.id,
        ChallengesAnalyticsParameters.kPostId: _feedGxC.currentPost.id,
      },
    );

    context.read<MainBloc>().add(
          PinChallengeEntryEvent(
            pinChallengeEnum: currentPostPinnedStatus
                ? PinChallengeEnum.UNPIN
                : PinChallengeEnum.PIN,
            challengeId: _feedGxC.currentPost.parentChallenge?.id ?? '',
            entryId: _feedGxC.currentPost.id,
          ),
        );
    _feedGxC.currentPost.isPinnedToChallenge = !currentPostPinnedStatus;
    setState(() {});
  }

  Widget _pinEntryButton() => _button(
        index: 0,
        child: FloatingActionButton(
          elevation: 0.0,
          heroTag: 'Pin Entry${widget.pageId}',
          backgroundColor: (_feedGxC.currentPost.isPinnedToChallenge ?? false)
              ? WildrColors.primaryColor
              : _unselectedColor,
          onPressed: _pinEntryMenu,
          child: const WildrIcon(
            WildrIcons.pinnedIcon,
            color: Colors.white,
          ),
        ),
      );

  void _showReposts() {
    Navigator.of(context).pop();
    if (_currentPost.isParentPostDeleted()) {
      Common()
          .showSnackBar(context, _appLocalizations.post_listNoLongerAvailable);
      return;
    }
    if (_currentPost.isRepost()) {
      final Post? parentPost = _currentPost.repostMeta?.parentPost;
      if (parentPost == null) return;
      parentPost.subPosts = _currentPost.subPosts;
      context.pushRoute(RepostsListPageRoute(parentPost: parentPost));
    } else {
      context.pushRoute(RepostsListPageRoute(parentPost: _currentPost));
    }
  }

  void _showReactionsPage() {
    Navigator.of(context).pop();
    showModalBottomSheet(
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      context: context,
      builder: (context) => SizedBox(
        height: Get.height * 0.9,
        child: ReactionListPage(_currentPost),
      ),
    );
  }

  Widget _menuView() {
    final BoxDecoration tileDecoration = BoxDecoration(
      color: Theme.of(context).brightness == Brightness.dark
          ? WildrColors.darkCardColor
          : const Color(0xFFEAEAEB),
      borderRadius: const BorderRadius.all(
        Radius.circular(15),
      ),
    );
    return StatefulBuilder(
      builder: (context, updateState) => Container(
        padding: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.background,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(15),
            topRight: Radius.circular(15),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Common().bottomSheetDragger(),
                Container(
                  margin: const EdgeInsets.only(top: 10),
                  decoration: tileDecoration,
                  child: ListTile(
                    leading: const WildrIcon(WildrIcons.users_filled),
                    title: Text(_appLocalizations.post_cap_reactions),
                    onTap: _showReactionsPage,
                  ),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 10),
                  decoration: tileDecoration,
                  child: ListTile(
                    leading: const WildrIcon(WildrIcons.repost),
                    title: Text(_appLocalizations.post_cap_reposts),
                    onTap: _showReposts,
                  ),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 10),
                  decoration: tileDecoration,
                  child: ListTile(
                    leading: _isShareLoading
                        ? const CupertinoActivityIndicator()
                        : const WildrIcon(WildrIcons.share_filled),
                    title: Text(_appLocalizations.challenge_cap_share),
                    onTap: () async {
                      await _shareIt(updateState);
                    },
                  ),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 10),
                  decoration: tileDecoration,
                  child: ListTile(
                    leading: WildrIcon(
                      _isAuthor
                          ? WildrIcons.trash_outline
                          : WildrIcons.exclamation_circle_filled,
                    ),
                    title: Text(
                      _isAuthor
                          ? _appLocalizations.commentsAndReplies_delete
                          : _appLocalizations.commentsAndReplies_report,
                    ),
                    onTap: () {
                      if (_isAuthor) {
                        _delete();
                      } else {
                        _reportIt();
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool get _isAuthor => _currentUserId == _currentPost.author.id;

  void _openMenu() {
    if (widget.postNotFound) return;
    debugPrint('OpenMenu ${_currentUserGxC.user.id}');
    showModalBottomSheet(
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      context: context,
      builder: (context) => _menuView(),
    );
  }

  Widget _menuBtn() => _button(
        index: 1,
        child: FloatingActionButton(
          elevation: 0.0,
          heroTag: 'Menu${widget.pageId}',
          backgroundColor: _unselectedColor,
          onPressed: _openMenu,
          child: const WildrIcon(
            WildrIcons.dots_horizontal_filled,
            color: Colors.white,
          ),
        ),
      );

  void _toggleMenuButton() {
    if (_animationController.isDismissed) {
      setState(() {
        _isExpanded = true;
      });
      _animationController.forward();
    } else {
      setState(() {
        _isExpanded = false;
      });
      _animationController.reverse();
    }
  }

  Widget toggleButton() => FloatingActionButton(
        elevation: 0,
        heroTag: 'toggleButton${widget.pageId}',
        backgroundColor: _buttonColor.value,
        onPressed: _toggleMenuButton,
        child: AnimatedIcon(
          color: Colors.white,
          icon: AnimatedIcons.menu_close,
          progress: _animateIcon,
        ),
      );

  Widget _button({
    required int index,
    required Widget child,
    bool isShowingCount = false,
  }) =>
      Container(
        height: (index == 1 /*|| isShowingCount*/)
            ? Get.height * 0.10
            : Get.height * 0.11,
        width: 50.0,
        alignment: FractionalOffset.topCenter,
        child: ScaleTransition(
          scale: CurvedAnimation(
            parent: _animationController,
            curve: Interval(
              0.0,
              1.0 - index / 4 / 2.0,
              curve: Curves.easeOut,
            ),
          ),
          child: child,
        ),
      );

  void _mainBlocListener(context, MainState state) {
    if (state is AuthStateChangedState) {
      _currentUserGxC = Get.find(tag: CURRENT_USER_TAG);
      _currentUserId = _currentUserGxC.user.id;
      setState(() {});
    } else if (state is TriggerLikeState) {
      _doLikeReaction(false, disableUnlike: true);
    } else if (state is ReactedOnPostState) {
      setState(() {});
      if (!state.isSuccessful) {
        Common().showSnackBar(
          context,
          state.errorMessage!,
          isDisplayingError: true,
        );
        if (previousPostContext != null) {
          if (_feedGxC.posts.isEmpty) {
            _currentPost.postContext = previousPostContext!;
          } else {
            _feedGxC.posts[state.postIndex].postContext = previousPostContext!;
          }
          setState(() {});
        }
        if (previousPostStats != null) {
          if (_feedGxC.posts.isEmpty) {
            _currentPost.stats = previousPostStats!;
          } else {
            _feedGxC.posts[state.postIndex].stats = previousPostStats!;
          }
          setState(() {});
        }
      }
    } else if (state is PinChallengeEntryState) {
      setState(() {});
    } else if (state is PaginateChallengeConnectionState) {
      _feedGxC.updateCurrentVisiblePost();
      setState(() {});
    } /* else if (state is HomeFeedUpdateState) {
      setState(() {});
    } else if (state is GetSinglePostDataUpdateState) {
      setState(() {});
    } else if (state is UserPageFeedUpdateState) {
      setState(() {});
    }*/
  }

  bool get _canShowPinnedIcon {
    if (_feedGxC.currentPost.isRepost()) return false;
    return _isExpanded &&
        _feedGxC.currentPost.parentChallenge != null &&
        (_feedGxC.currentPost.parentChallenge?.isOwner ?? false);
  }

  @override
  Widget build(BuildContext context) {
    _currentPost = _feedGxC.currentPost;
    return MultiBlocListener(
      listeners: [
        BlocListener<MainBloc, MainState>(listener: _mainBlocListener),
      ],
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Expanded(child: Container()),
          if (_canShowPinnedIcon) _pinEntryButton(),
          if ((_isExpanded && _currentPost.canRepost()) || widget.postNotFound)
            _repostBtn(),
          if (_isExpanded) _likeBtn(),
          if (_isExpanded) _commentStoryBtn(),
          if (_isExpanded) _menuBtn(),
          toggleButton(),
        ],
      ),
    );
  }
}

void print(dynamic message) {
  debugPrint('PostHamburgerMenu: $message');
}
