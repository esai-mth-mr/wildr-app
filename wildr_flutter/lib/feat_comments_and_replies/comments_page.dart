import 'dart:async';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:blur/blur.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_keyboard_size/flutter_keyboard_size.dart';
import 'package:flutter_keyboard_visibility/flutter_keyboard_visibility.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:get/get.dart';
import 'package:keyboard_attachable/keyboard_attachable.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_comments_and_replies/comment_gxc.dart';
import 'package:wildr_flutter/feat_comments_and_replies/likes_page.dart';
import 'package:wildr_flutter/feat_comments_and_replies/reply_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/report_ext/report_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/wildr_verify_ext/wildr_verify_state.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/comment.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';
import 'package:wildr_flutter/home/model/onboarding_type_enum.dart';
import 'package:wildr_flutter/home/model/reply.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/dialogs/wildr_dialog_box.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/smart_refresher/pagination_footer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';
import 'package:wildr_flutter/widgets/text/expandable_text.dart';

part 'comments_page_common.dart';
part 'comments_tab.dart';
part 'replies_page.dart';

void print(dynamic message) {
  debugPrint('CommentsPage: $message');
}

class CommentsPage extends StatefulWidget {
  final ChallengeOrPost parent;
  final String? commentToNavigateToId;
  final String? replyToNavigateToId;
  final String parentPageId;

  const CommentsPage({
    super.key,
    required this.parent,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
    required this.parentPageId,
  });

  @override
  CommentsAndRepliesPageState createState() => CommentsAndRepliesPageState();
}

class CommentsAndRepliesPageState extends State<CommentsPage>
    with SingleTickerProviderStateMixin {
  late final CommentGxC _commentGxC;
  late final ReplyGxC _replyGxC;
  late ChallengeOrPost parent = widget.parent;
  late final FocusNode commentFocusNode;
  late final FocusNode replyFocusNode;
  late CurrentUserProfileGxC _currentUserGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  bool showLoader = true;
  bool isCommentReplyOnboardingDialogVisible = false;

  @override
  void initState() {
    commentFocusNode = FocusNode();
    replyFocusNode = FocusNode();
    _commentGxC = Get.put(CommentGxC(), tag: widget.parentPageId);
    _replyGxC = Get.put(ReplyGxC(), tag: widget.parentPageId);
    _currentUserGxC = Get.find(tag: CURRENT_USER_TAG);
    super.initState();
    // Log page changes to analytics

    // is needed to "activate" the _replyGxC, otherwise GetX was unable to find
    // it for some reason
    _replyGxC.isSendingReply.value = false;
    if (widget.parent is Post) {
      _replyGxC.postId = widget.parent.id;
    } else {
      _replyGxC.challengeId = widget.parent.id;
    }
    _commentGxC.currentTab.stream.listen((index) {
      if (mounted) {
        FirebaseAnalytics.instance.setCurrentScreen(
          screenName:
              '${CommentsPageRoute.name}/${index == 0 ? 'Comments' : 'Replies'}',
        );
        if (index == 1) {
          context.router.push(
            RepliesPageRoute(
              parentPageId: widget.parentPageId,
              boxDecoration: _boxDecoration,
              inputDecoration: _inputDecoration('Add a reply'),
              keyboardBasedEdgeInsets: _keyboardBasedEdgeInsets(context),
              focusNode: replyFocusNode,
              showLoader: showLoader,
              canReplyStr: _getCannotCommentMessage(isReply: true) != null
                  ? _getCannotCommentMessage()!.replaceAll('comment', 'reply')
                  : _getCannotCommentMessage(),
              replyToNavigateToId: widget.replyToNavigateToId,
              canViewCommentsStr:
                  parent.commentVisibilityACC?.cannotViewCommentErrorMessage,
              parent: parent,
              //hasSkippedEmbargo: _hasSkippedEmbargo,
            ),
          );
        }
        FocusScope.of(context).unfocus();
        if (index == 0) {
          if (replyFocusNode.hasFocus && _getCannotCommentMessage() == null) {
            // commentFocusNode.requestFocus();
          }
        } else {
          if (commentFocusNode.hasFocus && _getCannotCommentMessage() == null) {
            // replyFocusNode.requestFocus();
          } else {
            if (_getCannotCommentMessage() == null) {
              // Future.delayed(Duration(milliseconds: 500)).
              // then((value) => replyFocusNode.requestFocus());
            }
          }
        }
      }
    });

    if (!_currentUserGxC.user.onboardingStats.commentReplyLikes) {
      // Refresh the current user to get the up-to-date onboarding stats
      Common()
          .mainBloc(context)
          .add(RefreshCurrentUserDetailsEvent(_currentUserGxC.user.id));
    }
  }

  int daysBetween(DateTime from, DateTime to) {
    final formattedFrom = DateTime(from.year, from.month, from.day);
    final formattedTo = DateTime(to.year, to.month, to.day);
    return (formattedTo.difference(formattedFrom).inHours / 24).round();
  }

  DateTime sevenDaysLater(DateTime date) =>
      DateTime(date.year, date.month, date.day + 6);

  String? _getCannotCommentMessage({bool isReply = false}) {
    if (!Common().isLoggedIn(context)) {
      return "Please sign in to ${isReply ? "reply" : 'comment'}";
    } else if (_currentUserGxC.user.isSuspended ?? false) {
      if (isReply) {
        return _appLocalizations.commentsAndReplies_suspendedUserCantReply;
      }
      return _appLocalizations.commentsAndReplies_suspendedUserCantComment;
    } else if (_currentUserGxC.user.shouldShowWildrVerifyBanner) {
      return _appLocalizations.commentsAndReplies_youReNotVerified;
    } else if (!(parent.commentPostingACC?.canComment ?? false)) {
      return parent.commentPostingACC?.cannotCommentErrorMessage;
    }
    return null;
  }

  InputDecoration _inputDecoration(String hintText) => InputDecoration(
        isDense: true,
        contentPadding:
            const EdgeInsets.only(left: 15, top: 12, bottom: 12, right: 35),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(35)),
          borderSide: BorderSide(color: WildrColors.accentColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(35)),
          borderSide: BorderSide(color: WildrColors.textColor()),
        ),
        hintText: hintText,
        hintStyle: TextStyle(
          fontSize: 16.0.sp,
          fontFamily: FontFamily.satoshi,
          fontWeight: FontWeight.w500,
        ),
      );

  late final _boxDecoration = BoxDecoration(
    color: Theme.of(context).bottomAppBarTheme.color,
  );

  EdgeInsets _keyboardBasedEdgeInsets(BuildContext context) => EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 10,
        top: 10,
        left: 18,
        right: 18,
      );

  Widget _content() => CommentsTab(
        parent: parent,
        parentPageId: widget.parentPageId,
        boxDecoration: _boxDecoration,
        inputDecoration: _inputDecoration(
          _appLocalizations.commentsAndReplies_addAComment,
        ),
        keyboardBasedEdgeInsets: _keyboardBasedEdgeInsets(context),
        focusNode: commentFocusNode,
        replyGxC: _replyGxC,
        canCommentStr: _getCannotCommentMessage(),
        showLoader: showLoader,
        commentToNavigateToId: widget.commentToNavigateToId,
        replyToNavigateToId: widget.replyToNavigateToId,
        context: context,
      );

  @override
  Widget build(BuildContext context) => KeyboardSizeProvider(
        child: Scaffold(
          appBar: (parent is Challenge)
              ? AppBar(
                  title: Text(
                    _appLocalizations.commentsAndReplies_communityDiscussion,
                  ),
                )
              : AppBar(
                  toolbarHeight: 1,
                  systemOverlayStyle:
                      Theme.of(context).brightness == Brightness.dark
                          ? SystemUiOverlayStyle.light
                          : SystemUiOverlayStyle.dark,
                  shadowColor: Colors.transparent,
                  elevation: 0,
                ),
          body: BlocListener<MainBloc, MainState>(
            listener: (context, state) {
              if (state is CurrentUserProfileRefreshState) {
                // TODO: Remove in V2 redesign
                if (!_currentUserGxC.user.onboardingStats.commentReplyLikes &&
                    !isCommentReplyOnboardingDialogVisible) {
                  showDialog(
                    context: context,
                    builder: (context) => WildrDialogBox.icon(
                      title: _appLocalizations.commentsAndReplies_likeComments,
                      bodyText: _appLocalizations
                          .commentsAndReplies_itsEasyAsATapOfAButton,
                      buttonText: _appLocalizations.comm_gotIt,
                      onPressed: Navigator.of(context).pop,
                      icon: WildrIcons.heart_filled,
                      iconColor: WildrColors.red,
                    ),
                  );
                  isCommentReplyOnboardingDialogVisible = true;
                  Common().mainBloc(context).add(
                        FinishOnboardingEvent(
                          OnboardingType.COMMENT_REPLY_LIKES,
                        ),
                      );
                }
                setState(() {});
              } else if (state is PaginateCommentsState) {
                if (state.parentId != parent.id) return;
                if (state.commentPostingACC != null) {
                  parent.commentPostingACC = state.commentPostingACC;
                }
                if (state.commentVisibilityACC != null) {
                  parent.commentVisibilityACC = state.commentVisibilityACC;
                }
                setState(() {
                  showLoader = false;
                });
              } else if (state is WildrVerifyState) {
                setState(() {});
              }
            },
            child: _content(),
          ),
        ),
      );

  @override
  void dispose() {
    _commentGxC.clearAll();
    _replyGxC
      ..clearAll()
      ..disposeId(widget.parentPageId);
    _commentGxC.disposeId(widget.parentPageId);
    super.dispose();
  }
}
