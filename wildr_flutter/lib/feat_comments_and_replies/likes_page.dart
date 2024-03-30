import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/widgets/buttons/wildr_outline_button.dart';

class LikesPage extends StatefulWidget {
  final String id;
  final int likeCount;
  final LikesPageType type;

  const LikesPage({
    super.key,
    required this.id,
    required this.likeCount,
    required this.type,
  });

  @override
  State<LikesPage> createState() => _LikesPageState();
}

class _LikesPageState extends State<LikesPage> {
  // Use a refresh indicator key to manually trigger a refresh and show the
  // loading indicator.
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      GlobalKey<RefreshIndicatorState>();
  List<WildrUser> users = [];
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Future<void> _onRefresh() async {
    final mainBloc = Common().mainBloc(context);

    if (widget.type == LikesPageType.COMMENTS) {
      mainBloc.add(
        PaginateCommentLikesEvent(
          widget.id,
          widget.likeCount,
        ),
      );
    } else if (widget.type == LikesPageType.REPLIES) {
      mainBloc.add(
        PaginateReplyLikesEvent(
          widget.id,
          widget.likeCount,
        ),
      );
    }

    // Wait until the state has been received.
    await mainBloc.stream.first;
  }

  void _listener(BuildContext context, MainState state) {
    if (state is PaginateCommentLikesState) {
      if (state.errorMessage != null) {
        Common().showErrorSnackBar(state.errorMessage!, context);
        return;
      }

      setState(() {
        users = state.users;
      });
    } else if (state is PaginateReplyLikesState) {
      if (state.errorMessage != null) {
        Common().showErrorSnackBar(state.errorMessage!, context);
        return;
      }

      setState(() {
        users = state.users;
      });
    } else if (state is FollowCTAState) {
      final user = users.firstWhere((user) => user.id == state.userId);

      if (state.errorMessage != null) {
        // Revert the eager update if an error occurred.
        user.currentUserContext?.isFollowing = false;

        Common().showErrorSnackBar(state.errorMessage!, context);
        return;
      }

      setState(() {
        user.currentUserContext?.isFollowing = true;
      });
    } else if (state is UnfollowCTAState) {
      final user = users.firstWhere((user) => user.id == state.userId);

      if (state.errorMessage != null) {
        user.currentUserContext?.isFollowing = true;
        Common().showErrorSnackBar(state.errorMessage!);
        return;
      }

      setState(() {
        user.currentUserContext?.isFollowing = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    // Trigger a refresh on the first frame.
    SchedulerBinding.instance.addPostFrameCallback((_) {
      _refreshIndicatorKey.currentState?.show();
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(_appLocalizations.commentsAndReplies_cap_likes),
        ),
        body: BlocListener<MainBloc, MainState>(
          listener: _listener,
          child: RefreshIndicator(
            key: _refreshIndicatorKey,
            onRefresh: _onRefresh,
            child: ListView.builder(
              itemCount: users.length,
              itemBuilder: (context, index) => LikedUserTile(
                user: users[index],
                showFollowButton:
                    Common().isLoggedIn(context) &&
                    Common().currentUserId(context) != users[index].id,
              ),
            ),
          ),
        ),
      );
}

class LikedUserTile extends StatefulWidget {
  final WildrUser user;
  final bool showFollowButton;

  const LikedUserTile({
    super.key,
    required this.user,
    this.showFollowButton = true,
  });

  @override
  State<LikedUserTile> createState() => _LikedUserTileState();
}

class _LikedUserTileState extends State<LikedUserTile> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  void followUser(BuildContext context, String userId) {
    // Perform an eager update.
    setState(() {
      widget.user.currentUserContext?.isFollowing = true;
    });

    Common().mainBloc(context).add(
          FollowUserEvent(
            userId,
          ),
        );
  }

  void unfollowUser(BuildContext context, String userId) {
    setState(() {
      widget.user.currentUserContext?.isFollowing = false;
    });

    Common().mainBloc(context).add(
          UnfollowUserEvent(
            userId,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final bool isFollowing =
        widget.user.currentUserContext?.isFollowing ?? false;

    return ListTile(
      leading: Common().avatarFromUser(
        context,
        widget.user,
        shouldNavigateToCurrentUser: false,
        // radius: 35,
      ),
      title: Text(widget.user.handle),
      subtitle: Text(widget.user.name ?? ''),
      trailing: widget.showFollowButton
          ? WildrOutlineButton(
              text: isFollowing
                  ? _appLocalizations.commentsAndReplies_cap_following
                  : _appLocalizations.commentsAndReplies_cap_follow,
              onPressed: () => isFollowing
                  ? unfollowUser(context, widget.user.id)
                  : followUser(context, widget.user.id),
            )
          : null,
      onTap: () => Common().openProfilePage(
        context,
        widget.user.id,
        shouldNavigateToCurrentUser: false,
        user: widget.user,
      ),
    );
  }
}

enum LikesPageType { COMMENTS, REPLIES }
