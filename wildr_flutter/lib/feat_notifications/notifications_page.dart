import 'dart:convert';

import 'package:align_positioned/align_positioned.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/challenge_cover.dart';
import 'package:wildr_flutter/feat_notifications/model/user_activity.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/buttons/wildr_outline_button.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('NotificationPage : $message');
}

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage>
    with AutomaticKeepAliveClientMixin {
  List<UserActivity> list = [];
  String endCursor = '';
  late final RefreshController _refreshController = RefreshController();
  late final _mainBloc = Common().mainBloc(context);
  late CurrentUserProfileGxC _currentUserGxC;
  String message = '';

  double get _outlineButtonWidth => 70.0.w;

  // final double iconSize = 20.0.sp;
  double get iconSize => 18.0.w;
  bool _isLoading = true;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    debugPrint('Init State');
    super.initState();
    _currentUserGxC = Get.find(tag: CURRENT_USER_TAG);
    _mainBloc.add(PaginateCurrentUserActivityEvent(null));
  }

  /// Trailing
  Widget _postTrailing(Post? post) => Common().postListTileIcon(post, context);

  Widget _challengeTrailing(Challenge? challenge) => Common().clipIt(
        child: SizedBox(
          width: 45,
          height: 50,
          child: ChallengeCoverCard(
            challenge: challenge,
            showDaysRemaining: false,
            useThumbnail: true,
          ),
        ),
        radius: 4,
      );

  Widget _followingButton(UserActivity activity, int index) {
    final bool isFollowing =
        activity.subjects.first.currentUserContext?.isFollowing ?? false;
    return WildrOutlineButton(
      text: isFollowing ? 'Following' : 'Follow',
      onPressed: () {
        if (isFollowing) {
          Common().mainBloc(context).add(
                UnfollowUserEvent(
                  activity.subjects.first.id,
                  index: index,
                  pageId: NOTIFICATIONS_PAGE_ID,
                ),
              );
          setState(() {
            list[index].subjects.first.currentUserContext?.isFollowing = false;
          });
        } else {
          Common().mainBloc(context).add(
                FollowUserEvent(
                  activity.subjects.first.id,
                  index: index,
                  pageId: NOTIFICATIONS_PAGE_ID,
                ),
              );
          setState(() {
            list[index].subjects.first.currentUserContext?.isFollowing = true;
          });
        }
      },
      width: _outlineButtonWidth,
    );
  }

  Widget _icAddBackButton(UserActivity activity, int index) {
    final bool isInnerCircle =
        activity.subjects.first.currentUserContext?.isInnerCircle ?? false;
    if (!isInnerCircle) {
      final bool isFollowing =
          activity.subjects.first.currentUserContext?.isFollowing ?? false;
      if (!isFollowing) {
        return _followingButton(activity, index);
      }
    }
    return WildrOutlineButton(
      text: isInnerCircle ? 'Remove' : 'Add Back',
      onPressed: () {
        if (isInnerCircle) {
          Common().mainBloc(context).add(
                ICRemoveMemberEvent(
                  activity.subjects.first.id,
                  index: index,
                  pageId: NOTIFICATIONS_PAGE_ID,
                ),
              );
          setState(() {
            list[index].subjects.first.currentUserContext?.isInnerCircle =
                false;
          });
        } else {
          Common().mainBloc(context).add(
                ICAddMemberEvent(
                  activity.subjects.first.id,
                  index: index,
                  pageId: NOTIFICATIONS_PAGE_ID,
                ),
              );
          setState(() {
            list[index].subjects.first.currentUserContext?.isInnerCircle = true;
          });
        }
      },
      width: _outlineButtonWidth,
    );
  }

  Widget _trailing(UserActivity activity, int index) {
    switch (activity.objectType) {
      case UserActivityObjectTypeEnum.NONE:
        return Container(color: Colors.red, width: 20, height: 20);
      case UserActivityObjectTypeEnum.TEXT_POST:
      case UserActivityObjectTypeEnum.IMAGE_POST:
      case UserActivityObjectTypeEnum.VIDEO_POST:
      case UserActivityObjectTypeEnum.MULTI_MEDIA_POST:
        return _postTrailing(activity.objectPost);
      case UserActivityObjectTypeEnum.COMMENT:
        return _postTrailing(activity.miscPost);
      case UserActivityObjectTypeEnum.REPLY:
        return _postTrailing(activity.miscPost);
      case UserActivityObjectTypeEnum.USER:
        switch (activity.verb) {
          case UserActivityVerbEnum.FOLLOWED:
            return _followingButton(activity, index);
          case UserActivityVerbEnum.MENTIONED_IN_POST:
          case UserActivityVerbEnum.MENTIONED_IN_COMMENT:
          case UserActivityVerbEnum.MENTIONED_IN_REPLY:
            return _postTrailing(activity.miscPost);
          case UserActivityVerbEnum.ADDED_TO_IC:
            return _icAddBackButton(activity, index);
          // ignore: no_default_cases
          default:
            return const SizedBox.shrink();
        }
      case UserActivityObjectTypeEnum.CHALLENGE:
        return _challengeTrailing(activity.objectChallenge);
    }
  }

  /// Leading
  Widget _likeReactionIcon() => CircleAvatar(
        backgroundColor: WildrColors.red,
        child: WildrIcon(
          WildrIcons.heart_filled,
          color: Colors.white,
          size: iconSize,
        ),
      );

  Widget _realReactionIcon() => CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        child: SizedBox(
          width: iconSize,
          height: iconSize,
          child: SvgPicture.asset('assets/icon/reaction_real.svg'),
        ),
      );

  Widget _applaudReactionIcon() => CircleAvatar(
        backgroundColor: WildrColors.yellow,
        child: SizedBox(
          width: iconSize,
          height: iconSize,
          child: SvgPicture.asset('assets/icon/reaction_applaud.svg'),
        ),
      );

  Widget _strikeReceivedIcon() => CircleAvatar(
        backgroundColor: WildrColors.errorColor,
        child: WildrIcon(
          WildrIcons.exclamation_circle_outline,
          color: Colors.white,
          size: iconSize,
        ),
      );

  Widget _postedIcon() => CircleAvatar(
        backgroundColor: WildrColors.teal,
        child: WildrIcon(
          WildrIcons.sparkles_outline,
          color: Colors.white,
          size: iconSize,
        ),
      );

  Widget _repostedIcon() => CircleAvatar(
        backgroundColor: WildrColors.indigo,
        child: WildrIcon(
          WildrIcons.repost,
          color: Colors.white,
          size: iconSize * 0.8,
        ),
      );

  Widget _innerCircleIcon() => const CircleAvatar(
        backgroundColor: Colors.transparent,
        child: WildrIconPng(
          WildrIconsPng.inner_circle,
        ),
      );

  Widget _ringColorImprovedIcon(activity) {
    Color color = WildrColors.primaryColor;
    if (activity.dataPayload != null) {
      final ringColor = jsonDecode(activity.dataPayload!)['ringColor'];
      if (ringColor != null) {
        if (ringColor == 'Green') {
          color = WildrColors.primaryColor;
        } else if (ringColor == 'Orange') {
          color = WildrColors.yellow;
        } else if (ringColor == 'red') {
          color = WildrColors.red;
        }
      }
    }

    return CircleAvatar(
      backgroundColor: color,
      child: WildrIcon(
        WildrIcons.celebration_filled,
        color: Colors.white,
        size: iconSize,
      ),
    );
  }

  Widget _commentedIcon() => CircleAvatar(
        backgroundColor: WildrColors.yellow,
        child: WildrIcon(
          WildrIcons.chat_outline,
          color: Colors.white,
          size: iconSize,
        ),
      );

  Widget _repliedIcon() => CircleAvatar(
        backgroundColor: WildrColors.yellow,
        child: WildrIcon(
          WildrIcons.reply_outline,
          color: Colors.white,
          size: iconSize,
        ),
      );

  Widget _mentionedIcon() => CircleAvatar(
        backgroundColor: WildrColors.fadedPrimaryColor,
        child: SizedBox(
          width: iconSize,
          height: iconSize,
          child: SvgPicture.asset(
            'assets/wildr_icons/at_symbol_filled.svg',
            colorFilter: const ColorFilter.mode(
              WildrColors.primaryColor,
              BlendMode.srcIn,
            ),
          ),
        ),
      );

  Widget _followedIcon() => CircleAvatar(
        backgroundColor: WildrColors.blue,
        child: WildrIcon(
          WildrIcons.user_check_outline,
          color: Colors.white,
          size: iconSize,
        ),
      );

  Widget _challengeIcon() => const CircleAvatar(
        backgroundColor: WildrColors.yellow,
        child: WildrIcon(
          WildrIcons.challenge_outline,
          color: Colors.white,
          size: 12,
        ),
      );

  Widget _leadingActivityIcon(UserActivity activity) {
    switch (activity.verb) {
      case UserActivityVerbEnum.UNKNOWN:
        return CircleAvatar(
          backgroundColor: Colors.white,
          child: WildrIcon(
            WildrIcons.exclamation_circle_filled,
            color: Colors.green,
            size: iconSize,
          ),
        );
      case UserActivityVerbEnum.REACTION_LIKE:
        return _likeReactionIcon();
      case UserActivityVerbEnum.REACTION_REAL:
        return _realReactionIcon();
      case UserActivityVerbEnum.REACTION_APPLAUD:
        return _applaudReactionIcon();
      case UserActivityVerbEnum.COMMENTED:
        return _commentedIcon();
      case UserActivityVerbEnum.REPLIED:
        return _repliedIcon();
      case UserActivityVerbEnum.REPOSTED:
        return _repostedIcon();
      case UserActivityVerbEnum.FOLLOWED:
        return _followedIcon();
      case UserActivityVerbEnum.COMMENT_EMBARGO_LIFTED:
        return _commentedIcon();
      case UserActivityVerbEnum.REC_FIRST_STRIKE:
      case UserActivityVerbEnum.REC_SECOND_STRIKE:
      case UserActivityVerbEnum.REC_FINAL_STRIKE:
        return _strikeReceivedIcon();
      case UserActivityVerbEnum.POSTED:
        return _postedIcon();
      case UserActivityVerbEnum.IMPROVED_PROFILE_RING:
        return _ringColorImprovedIcon(activity);
      case UserActivityVerbEnum.MENTIONED_IN_POST:
      case UserActivityVerbEnum.MENTIONED_IN_COMMENT:
      case UserActivityVerbEnum.MENTIONED_IN_REPLY:
        return _mentionedIcon();
      case UserActivityVerbEnum.ADDED_TO_IC:
      case UserActivityVerbEnum.AUTO_ADDED_TO_IC:
        return _innerCircleIcon();
      case UserActivityVerbEnum.AUTO_ADDED_TO_FOLLOWING:
        return _followedIcon();
      case UserActivityVerbEnum.JOINED_CHALLENGE:
        return _challengeIcon();
      case UserActivityVerbEnum.CHALLENGE_CREATED:
        return _challengeIcon();
    }
  }

  Widget _userImage(WildrUser user) => Common().avatarFromUser(
        context,
        user,
        shouldNavigateToCurrentUser: false,
        radius: 20.0.sp,
        ringDiff: 1,
        ringWidth: 1,
        shouldWrapInCloseFriendsIcon: false,
      );

  Widget _alignedWidgetAggregated(Widget parent, Widget child) => SizedBox(
        width: 45.0.w,
        height: 45.0.w,
        child: Align(
          child: AlignPositioned.relative(
            container: parent,
            child: child,
            moveByChildHeight: 0.38,
            moveByChildWidth: 0.4,
          ),
        ),
      );

  Widget _alignedWidgetSingleAct(Widget parent, Widget child) => SizedBox(
        width: 43.0.w,
        height: 43.0.w,
        child: Align(
          child: AlignPositioned.relative(
            container: parent,
            child: child,
            moveByChildHeight: 0.8,
            moveByChildWidth: 0.7,
          ),
        ),
      );

  String _subtitleTextStr(UserActivity activity) {
    if (activity.displayBodyStr == null) {
      switch (activity.verb) {
        case UserActivityVerbEnum.UNKNOWN:
          return 'NOTHING?';
        case UserActivityVerbEnum.REACTION_LIKE:
          if (activity.objectPost?.timeStamp?.expiryPercentage == 100) {
            return 'liked your story';
          } else {
            return 'liked your post';
          }
        case UserActivityVerbEnum.REACTION_REAL:
          return 'found your post real!';
        case UserActivityVerbEnum.REACTION_APPLAUD:
          return 'applauded your post';
        case UserActivityVerbEnum.COMMENTED:
          return 'commented: "${activity.miscComment?.body ?? ''}"';
        case UserActivityVerbEnum.REPLIED:
          return 'replied to your comment';
        case UserActivityVerbEnum.REPOSTED:
          return 'reposted your post';
        case UserActivityVerbEnum.FOLLOWED:
          return 'followed you';
        case UserActivityVerbEnum.COMMENT_EMBARGO_LIFTED:
          return 'you can now comment on posts';
        case UserActivityVerbEnum.REC_FIRST_STRIKE:
        case UserActivityVerbEnum.REC_SECOND_STRIKE:
          return 'strike imposed';
        case UserActivityVerbEnum.REC_FINAL_STRIKE:
          return 'final strike received.';
        case UserActivityVerbEnum.POSTED:
          return 'Just posted on Wildr.\nTap to view!';
        case UserActivityVerbEnum.IMPROVED_PROFILE_RING:
          return 'You’ve unlocked a new score on your profile';
        case UserActivityVerbEnum.MENTIONED_IN_POST:
          return 'mentioned you in their post';
        case UserActivityVerbEnum.MENTIONED_IN_COMMENT:
          return 'mentioned you in a comment';
        case UserActivityVerbEnum.MENTIONED_IN_REPLY:
          return 'mentioned you in a comment';
        case UserActivityVerbEnum.ADDED_TO_IC:
          return 'added you to their Inner Circle';
        case UserActivityVerbEnum.AUTO_ADDED_TO_IC:
          return 'has been added to your Inner Circle';
        case UserActivityVerbEnum.AUTO_ADDED_TO_FOLLOWING:
          return 'has been added to your Follower';
        case UserActivityVerbEnum.JOINED_CHALLENGE:
          return 'joined your challenge';
        case UserActivityVerbEnum.CHALLENGE_CREATED:
          return 'created a challenge';
      }
    } else {
      return activity.displayBodyStr ?? '';
    }
  }

  /// Activity Widgets
  TextStyle get _titleTextStyle =>
      TextStyle(fontWeight: FontWeight.w700, fontSize: 13.0.sp);

  String _getTimestampText(UserActivity activity) {
    String ts = activity.ts.updatedAt;
    if (ts.isNotEmpty && ts[0].isNotEmpty) {
      if (ts[0] == '~') {
        ts = ' $ts';
      } else if (ts[0] != '~') {
        ts = ' ~$ts';
      }
    }
    return ts;
  }

  Text _subtitleText(UserActivity activity) {
    final ts = _getTimestampText(activity);
    String textStr;
    if (activity.verb == UserActivityVerbEnum.UNKNOWN) {
      textStr = 'Please update the app to view this notification';
    } else {
      textStr = _subtitleTextStr(activity);
    }
    return Text.rich(
      TextSpan(
        style: TextStyle(
          color: WildrColors.textColor(context),
          fontSize: 13.5.sp,
        ),
        children: [
          TextSpan(
            text: textStr,
            style: TextStyle(
              fontWeight: FontWeight.w300,
              fontSize: 12.5.sp,
            ),
          ),
          if (ts.isNotEmpty)
            TextSpan(
              text: ts,
              style: TextStyle(
                fontWeight: FontWeight.w200,
                fontSize: 10.0.sp,
              ),
            ),
        ],
      ),
    );
  }

  Widget _singleActivity(UserActivity activity, index) {
    final Widget leadingChild = _leadingActivityIcon(activity);
    String titleStr;
    if (activity.verb == UserActivityVerbEnum.UNKNOWN) {
      titleStr = '-';
    } else {
      titleStr = '@${activity.subjects.first.handle}';
    }
    return ListTile(
      onTap: () {
        debugPrint('OnTap');
        if (activity.dataPayload == null) {
          debugPrint('DATA PAYLOAD = null');
          switch (activity.objectType) {
            case UserActivityObjectTypeEnum.NONE:
              break;
            case UserActivityObjectTypeEnum.IMAGE_POST:
            case UserActivityObjectTypeEnum.VIDEO_POST:
            case UserActivityObjectTypeEnum.TEXT_POST:
            case UserActivityObjectTypeEnum.MULTI_MEDIA_POST:
              context.pushRoute(
                SinglePostPageRoute(postId: activity.objectPost!.id),
              );
            case UserActivityObjectTypeEnum.COMMENT:
              Common().showSnackBar(context, 'Booo! 👻');
            case UserActivityObjectTypeEnum.REPLY:
              Common().showSnackBar(context, 'Booo! 👻');
            case UserActivityObjectTypeEnum.USER:
              Common().showSnackBar(context, 'Booo! 👻');
            case UserActivityObjectTypeEnum.CHALLENGE:
              Common().showSnackBar(context, 'Booo! 👻');
          }
        } else {
          Common().handleNotificationTap(
            jsonDecode(activity.dataPayload!),
            context,
          );
        }
      },
      leading: _alignedWidgetSingleAct(
        _userImage(activity.subjects.first),
        SizedBox(
          width: 22.0.sp,
          height: 22.0.sp,
          child: leadingChild,
        ),
      ),
      trailing: _trailing(activity, index),
      title: Text(titleStr, style: _titleTextStyle),
      subtitle: _subtitleText(activity),
    );
  }

  Widget _aggregatedActivity(UserActivity activity, int index) {
    Widget child;
    Widget leading;
    String titleStr;
    if (activity.subjects.length == 2) {
      // leading = SizedBox(width: 30, height: 30,
      // child: _userImage(activity.subjects.first));
      leading = _userImage(activity.subjects.first);
      child = _userImage(activity.subjects.last);
      if (activity.totalCount == null) {
        titleStr = '${activity.subjects.first.handle},'
            ' ${activity.subjects.last.handle}';
      } else {
        titleStr = '${activity.subjects.first.handle},'
            ' ${activity.subjects.last.handle},'
            ' and ${activity.totalCount! - 2} others';
      }
    } else {
      leading = _userImage(activity.subjects.first);
      // child = _leadingActivityIcon(activity);
      child = const SizedBox();
      titleStr = '${activity.subjects.first.handle}, '
          'and ${activity.totalCount} others...';
    }
    return ListTile(
      onTap: () {
        if (activity.dataPayload != null) {
          Common().handleNotificationTap(
            jsonDecode(activity.dataPayload!),
            context,
          );
        }
      },
      leading: _alignedWidgetAggregated(
        leading,
        SizedBox(width: 40, height: 40, child: child),
      ),
      trailing: _trailing(activity, index),
      title: Text(titleStr, style: _titleTextStyle),
      subtitle: _subtitleText(activity),
    );
  }

  void _onRefresh() {
    debugPrint('onRefresh');
    _mainBloc.add(PaginateCurrentUserActivityEvent(_currentUserGxC.user.id));
  }

  void _onLoadMore() {
    debugPrint('onLoadMore()');
    _mainBloc.add(
      PaginateCurrentUserActivityEvent(
        _currentUserGxC.user.id,
        after: endCursor,
      ),
    );
  }

  void _handleStateChange(PaginatedUserActivityState state) {
    if (state.errorMessage == null) {
      if (state.endCursor != null) {
        // print("Setting end cursor = ${state.endCursor}");
        endCursor = state.endCursor!;
      }
      if (_refreshController.isLoading) {
        if (state.activityList!.isEmpty) {
          _refreshController.loadNoData();
        } else {
          _refreshController.loadComplete();
          list.addAll(state.activityList!);
        }
      } else {
        if (state.activityList!.isEmpty) {
          _refreshController.refreshToIdle();
          message = 'No notifications at this time';
          _refreshController.loadNoData();
        } else {
          _refreshController..refreshCompleted()
          ..loadComplete();
          message = '';
        }

        list = state.activityList!;
      }
      setState(() {});
    } else {
      if (_refreshController.isRefresh) {
        _refreshController.refreshFailed();
      } else if (_refreshController.isLoading) {
        _refreshController.loadFailed();
      }
      //Common().showGetErrorSnackBar(state.errorMessage!);
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
    }
  }

  void _systemNotificationTap(UserActivity activity) {
    switch (activity.verb) {
      case UserActivityVerbEnum.UNKNOWN:
        Common().showAppUpdateDialog(context);
        return;
      case UserActivityVerbEnum.REC_FIRST_STRIKE:
      case UserActivityVerbEnum.REC_SECOND_STRIKE:
      case UserActivityVerbEnum.REC_FINAL_STRIKE:
        if (activity.dataPayload == null) {
          Common().showErrorSnackBar(kSomethingWentWrong, context);
          return;
        }
        debugPrint(activity.dataPayload);
        final String? reportId = ((json.decode(activity.dataPayload!)
            as Map<String, dynamic>)['reviewRequestId']) as String?;
        if (reportId == null) {
          Common().showErrorSnackBar(kSomethingWentWrong, context);
          return;
        }
        context.pushRoute(StrikeInfoPageRoute(reportId: reportId));
      // ignore: no_default_cases
      default:
        return;
    }
  }

  Widget _systemNotificationListTile(UserActivity activity) {
    String titleStr;
    if (activity.verb == UserActivityVerbEnum.UNKNOWN) {
      titleStr = 'Please update the app to view this notification';
    } else {
      titleStr = activity.displayBodyStr ?? '--';
    }
    return ListTile(
      onTap: () {
        _systemNotificationTap(activity);
      },
      leading: Container(child: _leadingActivityIcon(activity)),
      title: Text(titleStr, style: _titleTextStyle),
      subtitle: _subtitleText(activity),
    );
  }

  Widget _shimmer({required Widget child}) => Common().wrapInShimmer(child);

  Widget _loadingWidgetTile() => ListTile(
        leading: _shimmer(
          child: const CircleAvatar(backgroundColor: Colors.white),
        ),
        title: _shimmer(
          child: Container(
            width: Get.width / 1.5,
            height: 10,
            color: Colors.white,
          ),
        ),
        subtitle: _shimmer(
          child: Container(
            width: Get.width / 2,
            height: 10,
            color: Colors.white,
          ),
        ),
        trailing: Common().clipIt(
          child: _shimmer(
            child: Container(
              width: 45,
              height: 45,
              color: Colors.red,
              child: const Text('?'),
            ),
          ),
          radius: 4,
        ),
      );

  SmartRefresher _smartRefresher() => SmartRefresher(
        controller: _refreshController,
        onRefresh: _onRefresh,
        onLoading: _onLoadMore,
        enablePullUp: true,
        header: const MaterialClassicHeader(),
        footer: createEmptyPaginationFooter(),
        child: ListView.builder(
          shrinkWrap: true,
          itemCount: _isLoading ? 10 : list.length,
          itemBuilder: (context, index) {
            if (_isLoading) return _loadingWidgetTile();
            final UserActivity activity = list[index];
            if (activity.type == UserActivityTypeEnum.SINGLE) {
              return _singleActivity(activity, index);
            } else if (activity.type == UserActivityTypeEnum.AGGREGATED) {
              return _aggregatedActivity(activity, index);
            } else if (activity.type == UserActivityTypeEnum.SYSTEM) {
              return _systemNotificationListTile(activity);
            }
            return const ListTile(title: Text(kNA));
          },
        ),
      );

  Widget _bodyStack() {
    if (message.isNotEmpty) return Center(child: Text(message));
    return _smartRefresher();
  }

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is PaginatedUserActivityState) {
      _isLoading = false;
      _handleStateChange(state);
    } else if (state is FollowCTAState) {
      if (state.pageId == NOTIFICATIONS_PAGE_ID) {
        if (state.errorMessage == null) {
          if (state.index == null) {
            _refreshController.requestRefresh(needMove: false);
          }
        } else {
          Common().showErrorSnackBar(state.errorMessage!, context);
          if (state.index == null) {
            _refreshController.requestRefresh(needMove: false);
          } else {
            list[state.index!].subjects.first.currentUserContext?.isFollowing =
                false;
            setState(() {});
          }
        }
      }
    } else if (state is UnfollowCTAState) {
      if (state.pageId == NOTIFICATIONS_PAGE_ID) {
        if (state.errorMessage == null) {
          if (state.index == null) {
            _refreshController.requestRefresh(needMove: false);
          }
        } else {
          Common().showErrorSnackBar(state.errorMessage!, context);
          if (state.index == null) {
            _refreshController.requestRefresh(needMove: false);
          } else {
            list[state.index!].subjects.first.currentUserContext?.isFollowing =
                true;
            setState(() {});
          }
        }
      }
    } else if (state is InnerCircleAddMemberState) {
      if (state.pageId == NOTIFICATIONS_PAGE_ID) {
        if (state.errorMessage != null) {
          Common().showErrorSnackBar(state.errorMessage!, context);
          list[state.index].subjects.first.currentUserContext?.isInnerCircle =
              false;
          setState(() {});
        }
      }
    } else if (state is InnerCircleRemoveMemberState) {
      if (state.pageId == NOTIFICATIONS_PAGE_ID) {
        if (state.errorMessage != null) {
          Common().showErrorSnackBar(state.errorMessage!, context);
          list[state.index].subjects.first.currentUserContext?.isInnerCircle =
              true;
          setState(() {});
        }
      }
    } else if (state is RequestPaginateCurrentUserActivityEventState) {
      _onRefresh();
    }
  }

  Widget _body() => BlocListener<MainBloc, MainState>(
        listener: _mainBlocListener,
        child: _bodyStack(),
      );

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: _body(),
    );
  }
}
