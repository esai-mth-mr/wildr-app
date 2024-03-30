// ignore_for_file: prefer_expression_function_bodies

part of 'comments_page.dart';

class CommentsTab extends StatefulWidget {
  final ChallengeOrPost parent;
  final BoxDecoration boxDecoration;
  final InputDecoration inputDecoration;
  final EdgeInsets keyboardBasedEdgeInsets;
  final FocusNode focusNode;
  final ReplyGxC replyGxC;
  final String? canCommentStr;
  final bool showLoader;
  final String? commentToNavigateToId;
  final String? replyToNavigateToId;
  final String? canViewCommentsStr;
  final String parentPageId;
  final BuildContext context;

  CommentsTab({
    required this.parent,
    required this.boxDecoration,
    required this.inputDecoration,
    required this.keyboardBasedEdgeInsets,
    required this.focusNode,
    required this.replyGxC,
    required this.canCommentStr,
    required this.showLoader,
    required this.context,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
    required this.parentPageId,
    super.key,
  }) : canViewCommentsStr =
            parent.commentVisibilityACC?.cannotViewCommentErrorMessage;

  @override
  CommentsTabState createState() => CommentsTabState();
}

const double leftPadding = 20;

class CommentsTabState extends State<CommentsTab>
    with AutomaticKeepAliveClientMixin<CommentsTab> {
  late final ChallengeOrPost _parent = widget.parent;
  late CommentGxC _commentGxC;
  late final CurrentUserProfileGxC _currentUserGxC =
      Get.find(tag: CURRENT_USER_TAG);
  late final _commentScrollController = ScrollController();
  final ScrollController _scrollController = ScrollController();
  late final MentionsInputController _inputController =
      MentionsInputController();
  final RefreshController _commentRefreshController =
      RefreshController(initialRefresh: true);
  List<SearchMentionResponse> _mentionedResponseList = [];
  MentionedObject? _mentionedObject;
  String? _errorMessage;
  late final CurrentUserProfileGxC _currentUserBox =
      Get.find(tag: CURRENT_USER_TAG);
  double originalScrollPosition = 0.0;
  late StreamSubscription<bool> keyboardSubscription;
  final keyboardVisibilityController = KeyboardVisibilityController();
  final mentionsScrollController = ScrollController();

  List<Comment> get _list => _commentGxC.list.value;
  bool isContracted = true;
  bool _isFirstTime = true;
  bool _shouldShowLoadAboveButton = false;
  late final _mainBloc = Common().mainBloc(context);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _commentGxC = Get.find(tag: widget.parentPageId);
    if (_parent is Challenge) {
      _mainBloc.add(GetChallengePinnedCommentEvent(challengeId: _parent.id));
    } else {
      _mainBloc.add(GetPostPinnedCommentEvent(postId: _parent.id));
    }
    //use parent challenge pinnedComment
    // _commentGxC.pinnedComment = _post?.pinnedComment;
    if (_currentUserBox.isLoggedIn()) {
      _commentGxC.isAuthorOfThePost =
          _parent.author.id == _currentUserBox.user.id;
    } else {
      _commentGxC.isAuthorOfThePost = false;
    }
    keyboardSubscription =
        keyboardVisibilityController.onChange.listen((visible) {
      _animateWidgetWhenKeyboardOpens(isKeyboardVisible: visible);
    });
    super.initState();
  }

  Future<void> _animateWidgetWhenKeyboardOpens({
    required bool isKeyboardVisible,
  }) async {
    if (!mounted) return;
    if (isKeyboardVisible) {
      originalScrollPosition = _commentScrollController.position.pixels;
    }
    await Future.delayed(const Duration(milliseconds: 300));
    await _commentScrollController.animateTo(
      isKeyboardVisible
          ? _commentScrollController.position.pixels +
              MediaQuery.of(widget.context).viewInsets.bottom
          : originalScrollPosition,
      curve: Curves.easeOut,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  bool get wantKeepAlive => true;

  Widget _author() => Padding(
        padding: const EdgeInsets.only(
          right: 8.0,
        ),
        child: GestureDetector(
          onLongPress: () {
            Clipboard.setData(ClipboardData(text: _parent.author.handle));
            Common().showSnackBar(
              context,
              _appLocalizations.commentsAndReplies_handleCopiedToClipboard,
            );
          },
          child: Row(
            children: [
              IconButton(
                icon: WildrIcon(
                  WildrIcons.chevron_left_outline,
                  color: WildrColors.textColor(context),
                ),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
              Expanded(
                child: Row(
                  children: [
                    Common().avatarFromAuthor(
                      context,
                      _parent.author,
                      radius: 20.0.w,
                      shouldNavigateToCurrentUser: false,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: AutoSizeText(
                        _parent.author.handle,
                        style: TextStyle(
                          fontSize: 17.0.sp,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

  Widget _caption() => Container(
        width: Get.width,
        padding: const EdgeInsets.only(
          left: leftPadding,
          right: leftPadding,
          top: 10,
          bottom: 5,
        ),
        child: ExpandableTextFromSegments(
          _parent.caption ?? [],
          trimLines: 1,
          contracted: isContracted,
          onStateToggled: (isContracted) {
            setState(() {
              this.isContracted = isContracted;
            });
          },
          readMoreButtonText:
              _appLocalizations.commentsAndReplies_dottedSeeMore,
          tagsOrMentionsColor: WildrColors.primaryColor,
          contentStyle: TextStyle(
            fontSize: 14.0.sp,
            color: WildrColors.textColor(context),
            fontWeight: FontWeight.w500,
          ),
          clickableTextStyle: Common().captionTextStyle(),
        ),
      );

  Widget _postedDuration() => Padding(
        padding: const EdgeInsets.only(
          left: leftPadding,
          right: 8,
        ),
        child: Text(
          _parent.timeStamp?.createdAt ?? kNA,
          style: TextStyle(fontSize: 10.0.sp),
        ),
      );

/*  void _onPinnedCommentLongPress() {
    debugPrint('On LongPressed');
    if (_commentGxC.isAuthorOfThePost) {
      Common().mainBloc(context).add(
            PinCommentEvent(
              _parent.id,
              '',
              commentBeingUnpinned: _parent.pinnedComment,
              type: _parent.runtimeType,
            ),
          );
      _commentGxC.pinnedComment = null;
      _parent.pinnedComment = null;
      setState(() {});
    } else {
      AwesomeDialog(
        context: context,
        dialogType: DialogType.error,
        btnOkText: 'Got It',
        headerAnimationLoop: false,
        btnOkColor: WildrColors.primaryColor,
        btnOkOnPress: () {},
        title: 'Restricted Access',
        desc: 'Only the author of the post unpin this comment ',
        useRootNavigator: true,
      ).show();
    }
  }*/

  Widget _pinnedComment() => Obx(
        () => (_commentGxC.pinnedComment.id.isEmpty)
            ? const SizedBox(height: 0)
            : CommentListTile(
                itemIndex: -1,
                isPinned: true,
                commentGxC: _commentGxC,
                replyGxC: widget.replyGxC,
                currentUserGxC: _currentUserGxC,
                parent: _parent,
                canComment: _parent.canComment,
              ),
      );

  Widget _loadAboveButton() => Center(
        child: TextButton(
          onPressed: _loadMoreAbove,
          child: Text(
            _appLocalizations.commentsAndReplies_loadNewComments,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: WildrColors.primaryColor,
            ),
          ),
        ),
      );

  Widget _commentsTab() => FooterLayout(
        footer: KeyboardAttachable(child: _commentBox()),
        child: Stack(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_parent is Post) ...[
                  Padding(
                    padding: const EdgeInsets.only(right: 5, top: 10),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _author(),
                        if (_parent.caption != null) ...[
                          if (_parent.caption!.isNotEmpty) _caption(),
                          _postedDuration(),
                        ],
                        _pinnedComment(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                if (_parent is Challenge) ...[
                  _pinnedComment(),
                ],
                if (_shouldShowLoadAboveButton) _loadAboveButton(),
                Expanded(child: _listOfComments()),
              ],
            ),
            CPCommon.mentionedList(
              _mentionedObject,
              _mentionedResponseList,
              _errorMessage,
              _inputController,
              context: context,
              isChallenge: widget.parent is Challenge,
              onInsertion: () {
                _mentionedObject = null;
                _mentionedResponseList = [];
                setState(
                  () {},
                );
              },
              onClose: () {
                _mentionedObject = null;
                _mentionedResponseList = [];
                setState(
                  () {},
                );
              },
              scrollController: mentionsScrollController,
            ),
          ],
        ),
      );

  void _onRefresh() {
    String? includingAndAfter;
    if (_isFirstTime) {
      includingAndAfter = widget.commentToNavigateToId;
    }
    Common().mainBloc(context).add(
          PaginateCommentsEvent(
            _parent.id,
            10,
            isRefreshing: true,
            includingAndAfter: includingAndAfter,
            targetCommentId: includingAndAfter,
            type: _parent.runtimeType,
          ),
        );
  }

  void _loadMoreAbove() {
    _commentGxC.selectedCommentId = '';
    if (_list.isEmpty) {
      _onRefresh();
      _commentRefreshController.loadComplete();
    } else {
      Common().mainBloc(context).add(
            PaginateCommentsEvent(
              _parent.id,
              10,
              isRefreshing: false,
              before: _list.first.id,
              type: _parent.runtimeType,
            ),
          );
    }
  }

  void _loadMoreBelow() {
    if (_list.isEmpty) {
      _onRefresh();
      _commentRefreshController.loadComplete();
    } else {
      print('Paginating form _loadMorebelwo');
      Common().mainBloc(context).add(
            PaginateCommentsEvent(
              _parent.id,
              10,
              isRefreshing: false,
              after: _list.last.id,
              type: _parent.runtimeType,
            ),
          );
    }
  }

  Widget _listOfComments() => SmartRefresher(
        controller: _commentRefreshController,
        onRefresh: _onRefresh,
        onLoading: _loadMoreBelow,
        enablePullUp: true,
        header: ClassicHeader(
          idleText: _isFirstTime ? '' : null,
          idleIcon: _isFirstTime ? const SizedBox() : null,
          completeText: _isFirstTime ? '' : null,
          completeIcon: _isFirstTime ? const SizedBox() : null,
          refreshingText: _isFirstTime ? '' : null,
          refreshingIcon: _isFirstTime ? const SizedBox() : null,
        ),
        footer: createEmptyPaginationFooter(),
        child: ListView.builder(
          controller: _commentScrollController,
          padding: const EdgeInsets.only(top: 10),
          shrinkWrap: true,
          itemBuilder: (context, index) => CommentListTile(
            itemIndex: index,
            commentGxC: _commentGxC,
            replyGxC: widget.replyGxC,
            currentUserGxC: _currentUserGxC,
            parent: _parent,
            canComment: _parent.canComment,
          ),
          itemCount: _list.length,
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        ),
      );

  void _submitComment() {
    if (_inputController.text.isBlank ?? true) {
      return;
    }
    _commentGxC.isSendingComment.value = true;
    Common().mainBloc(context).add(
          AddCommentEvent(
            _inputController.data,
            _parent.id,
            type: _parent.runtimeType,
          ),
        );
  }

  Widget _mentionsInput() => Scrollbar(
        controller: _scrollController,
        thumbVisibility: true,
        child: CPCommon.mentionsInput(
          focusNode: widget.focusNode,
          controller: _inputController,
          scrollController: _scrollController,
          onSubmit: _submitComment,
          onChanged: (text) {
            if (text.isEmpty) {
              _mentionedObject = null;
              _mentionedResponseList = [];
              setState(() {});
              return;
            }
            final result = SmartTextCommon().handleMentionedObject(
              controller: _inputController,
              mentionedObject: _mentionedObject,
              mainBloc: Common().mainBloc(context),
              mentionedResponseList: _mentionedResponseList,
            );
            if (!result.shouldUpdate) return;
            _mentionedObject = result.mentionedObject;
            _mentionedResponseList = result.mentionedResponseList;
            setState(() {});
          },
          inputDecoration: widget.inputDecoration,
        ),
      );

  Widget _sendButton() => Obx(
        () => Padding(
          padding: const EdgeInsets.only(right: 10),
          child: SizedBox(
            height: 30,
            width: 30,
            child: AnimatedSwitcher(
              transitionBuilder: (child, animation) => ScaleTransition(
                scale: animation,
                child: child,
              ),
              duration: const Duration(milliseconds: 500),
              child: _commentGxC.isSendingComment.value
                  ? const SizedBox(
                      height: 30,
                      width: 30,
                      child: Padding(
                        padding: EdgeInsets.all(2.0),
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                        ),
                      ),
                    )
                  : IconButton(
                      padding: EdgeInsets.zero,
                      onPressed: _submitComment,
                      icon: const WildrIcon(
                        WildrIcons.paper_airplane_filled,
                        color: WildrColors.accentColor,
                      ),
                    ),
            ),
          ),
        ),
      );

  Widget _commentTextBox() => Container(
        padding: EdgeInsets.only(
          left: widget.keyboardBasedEdgeInsets.left,
          right: widget.keyboardBasedEdgeInsets.right,
          top: widget.keyboardBasedEdgeInsets.top,
          bottom: widget.canViewCommentsStr == null
              ? widget.keyboardBasedEdgeInsets.bottom
              : 0,
        ),
        decoration: widget.boxDecoration,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.centerRight,
          children: [
            _mentionsInput(),
            _sendButton(),
          ],
        ),
      );

  Widget _blurredSheetForCommentsBox(double blur) => Positioned.fill(
        child: Blur(
          blur: blur,
          blurColor: Theme.of(context).colorScheme.background,
          child: Container(),
        ),
      );

  Widget _commentBox() {
    final List<Widget> children = [_commentTextBox()];
    if (widget.showLoader || widget.canCommentStr != null) {
      children
        ..add(_blurredSheetForCommentsBox(3))
        ..add(
          Padding(
            padding: const EdgeInsets.only(top: 25),
            child: widget.showLoader
                ? const Center(child: CupertinoActivityIndicator())
                : Center(
                    child: Text(
                      widget.canCommentStr!,
                      textAlign: TextAlign.center,
                    ),
                  ),
          ),
        );
    }
    if (_currentUserGxC.isLoggedIn() &&
        _currentUserGxC.user.shouldShowWildrVerifyBanner &&
        !widget.showLoader) {
      children
        ..clear()
        ..add(
          Column(
            children: [
              Common().unverifiedUserBanner(_currentUserGxC.user, context),
              Stack(
                children: [
                  _commentTextBox(),
                  if (widget.showLoader || widget.canCommentStr != null) ...[
                    _blurredSheetForCommentsBox(1),
                  ],
                ],
              ),
            ],
          ),
        );
    }
    if (widget.canViewCommentsStr != null) {
      return DecoratedBox(
        decoration: widget.boxDecoration,
        child: Column(
          children: [
            Stack(
              children: children,
            ),
            Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).padding.bottom,
                top: 8,
                left: widget.keyboardBasedEdgeInsets.left,
                right: widget.keyboardBasedEdgeInsets.right,
              ),
              child: Center(
                child: Text(
                  widget.canViewCommentsStr!,
                  style: const TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Stack(children: children);
  }

  void _addCommentState(AddCommentsState state) {
    _commentGxC.isSendingComment.value = false;
    if (state.errorMessage == null) {
      _inputController.clear();
      widget.replyGxC.list.value.clear();
      _mentionedObject = null;
      _mentionedResponseList = [];
      _errorMessage = null;
      // _list.insert(0, state.comment);
      setState(() {});
      _onRefresh();
    } else {
      if (state.postNotFound) {
        Navigator.pop(context);
        Common().showSnackBar(
          context,
          state.errorMessage!,
          isDisplayingError: true,
        );
      } else {
        Common().showSnackBar(
          context,
          state.errorMessage!,
          isDisplayingError: true,
        );
      }
    }
  }

  void _reactOnCommentState(ReactOnCommentState state) {
    if (state.errorMessage != null) {
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );

      // Revert the comment action if there is an error.
      setState(() {
        final comment = _list
            .firstWhere((comment) => comment.id == state.commentId)
          ..hasLiked = false;
        comment.likeCount--;
      });
    }
  }

  void _paginateCommentsState(PaginateCommentsState state) {
    if (state.parentId != widget.parent.id) {
      return;
    }
    _commentGxC.isSendingComment.value = false;
    if (state.commentPostingACC != null) {
      _parent.commentPostingACC = state.commentPostingACC;
    }
    _commentRefreshController.refreshCompleted();
    if (state.errorMessage != null) {
      _commentRefreshController
        ..refreshFailed()
        ..loadComplete();
      Common().showErrorSnackBar(state.errorMessage!, context);
      return;
    }
    if (state.isRefreshing) {
      _list.clear();
    }
    _shouldShowLoadAboveButton = state.shouldShowLoadAboveButton;
    if (state.comments.isEmpty) {
      _commentRefreshController.loadNoData();
      _isFirstTime = false;
      setState(() {});
      if (state.targetCommentError != null) {
        Common().showSnackBar(
          context,
          state.targetCommentError!,
        );
      }
      return;
    }
    if (state.isLoadingAbove) {
      _list.insertAll(0, state.comments);
    } else {
      _list.addAll(state.comments);
    }
    _commentRefreshController.loadComplete();
    if (_isFirstTime) {
      if (widget.replyToNavigateToId != null) {
        _replyToTheFirstComment();
      }
      if (widget.replyToNavigateToId != null ||
          widget.commentToNavigateToId != null) {
        if (state.targetCommentError == null) {
          _commentGxC.selectedCommentId = widget.commentToNavigateToId!;
          Common().delayIt(
            () {
              if (mounted) {
                setState(() {
                  _commentGxC.selectedCommentId = '';
                });
              }
            },
            millisecond: 2000,
          );
          if (state.comments.indexWhere(
                (comment) => comment.id == widget.commentToNavigateToId,
              ) ==
              -1) {
            Common().showSnackBar(
              context,
              _appLocalizations.commentsAndReplies_commentNotFound,
            );
          }
        } else {
          Common().showSnackBar(
            context,
            state.targetCommentError!,
          );
        }
      }
    }
    setState(() {});
    Common().delayIt(() => _isFirstTime = false);
  }

  void _replyToTheFirstComment() {
    final commentToReply = _list[0];
    if (commentToReply.isLocked()) {
      Common().justShowWarningDialog(
        context,
        title: _appLocalizations.commentsAndReplies_lockedComment,
        message: _appLocalizations
            .commentsAndReplies_lockedCommentMessageViewAndReply,
      );
      return;
    }
    if (_commentGxC.commentsList.isNotEmpty) {
      _commentGxC.replyingToComment = _commentGxC.commentsList.first;
    } else {
      _commentGxC.replyingToComment = null;
    }

    _commentGxC.replyingToCommentBodyWidget = CPCommon.smartBody(
      commentToReply.body,
      commentToReply.segments,
      context,
    );
    if (_commentGxC.currentTab.value == 1) {
      _commentGxC.currentTab.value = 0;
    }
    _commentGxC.currentTab.value = 1;
  }

  void _deleteCommentState(DeleteCommentState state) {
    if (state.parentPostId != widget.parent.id) {
      print('DeleteCommentState returning');
      return;
    }
    if (!state.isSuccessful) {
      Common().showErrorSnackBar(state.errorMessage!, context);
    } else {
      Common().showSuccessDialog(
        context,
        message: _appLocalizations
            .commentsAndReplies_commentHasBeenSuccessfullyDeleted,
      );
    }
    if (state.index < _list.length) {
      final commentToDelete = _list[state.index];
      if (commentToDelete.id == state.commentId) {
        if (state.isSuccessful) {
          _commentGxC.list.value.removeAt(state.index);
        } else {
          _commentGxC.list.value[state.index].willBeDeleted = false;
        }
        debugPrint('${_commentGxC.pinnedComment.id} == ${commentToDelete.id}');
        if (_commentGxC.pinnedComment.id == commentToDelete.id) {
          _commentGxC.pinnedComment = Comment.empty();
          _parent.pinnedComment = null;
        }
        setState(() {});
        return;
      }
    }
    //VERY RARE CASE
    if (state.isSuccessful) {
      _commentGxC.list.value
          .removeWhere((comment) => comment.id == state.commentId);
      // _feedGxC.currentPost.stats.commentCount -= 1;
      // _feedGxC.currentPost = _feedGxC.currentPost;
    } else {
      _commentGxC.list.value
          .firstWhere((comment) => comment.id == state.commentId)
          .willBeDeleted = false;
    }
    setState(() {});
  }

  void _pinCommentResultState(PinACommentResult state) {
    debugPrint('PinACommentResult ${state.isSuccessful}');
    if (state.parentPostId != widget.parent.id) {
      print('returning');
      return;
    }
    if (!state.isSuccessful) {
      Common().showErrorSnackBar(state.errorMessage!);
      _commentGxC.pinnedComment = state.commentToUnpin;
      _parent.pinnedComment = state.commentToUnpin;
    }
    setState(() {});
  }

  void _mentionsInputResult(MentionsInputResult state) {
    if (_mentionedObject == null) {
      debugPrint('mentionedObject = null');
      return;
    }
    setState(() {
      _mentionedResponseList = state.response ?? [];
      _errorMessage = state.errorMessage;
    });
  }

  void _updateCommentParticipationTypeResult(
    UpdateCommentParticipationTypeResult state,
  ) {
    if (!state.isSuccessful) {
      _commentGxC.list.value[state.index!].toggleLockedStatus();
      Common().showErrorSnackBar(state.errorMessage!);
      setState(() {});
    }
  }

  void _reportCommentState(ReportCommentState state) {
    if (state.isSuccessful) {
      Common().showSuccessDialog(
        context,
        title: _appLocalizations.commentsAndReplies_commentReported,
        message: reportDoneText,
      );
      // Common().showConfirmationGetSnackbar
      // ("You've successfully reported this comment!");
    } else {
      Common().showErrorSnackBar(state.errorMessage!);
    }
  }

  void _commentTrollingDetected(CommentTrollingDetectedState state) {
    _commentGxC.isSendingComment.value = false;
    Common().showTrollDetectedDialog(
      context,
      object: _appLocalizations.commentsAndReplies_comment,
      onYesTap: () {
        _commentGxC.isSendingComment.value = true;
        Common().mainBloc(context).add(
              AddCommentEvent(
                _inputController.data,
                _parent.id,
                negativeConfidenceCount: state.data.negativeCount,
                shouldBypassTrollDetection: true,
                type: _parent.runtimeType,
              ),
            );
      },
    );
  }

  void _deleteReplyState(DeleteReplyState state) {
    setState(() {});
  }

  void _flagCommentState(FlagCommentState state) {
    if (state.errorMessage != null) {
      Common().showErrorSnackBar(state.errorMessage!);
      Comment? comment;
      if (state.index < _list.length) {
        comment = _list[state.index];
      }
      if (comment == null || comment.id != state.commentId) {
        comment =
            _list.firstWhereOrNull((element) => element.id == state.commentId);
      }
      if (comment == null) {
        print('_flagCommentState `comment` is null');
        return;
      }
      switch (state.operation) {
        case FlagCommentOperation.FLAG:
          comment.flagStatus = null;
          setState(() {});
        case FlagCommentOperation.UN_FLAG:
          comment.flagStatus = CommentFlagStatus.FLAGGED;
          setState(() {});
      }
    }
  }

  void _blockUserState(BlockUserState state) {
    if (state.pageId == 'comments-page#${_parent.id}') {
      context.loaderOverlay.hide();
      if (state.errorMessage == null) {
        Common().showSnackBar(
          context,
          _appLocalizations.commentsAndReplies_userBlockedSuccessfully,
        );
        Navigator.pop(context);
      } else {
        Common().showErrorSnackBar(state.errorMessage!);
      }
    }
  }

  void _blockCommenterOnPostState(BlockCommenterOnPostState state) {
    context.loaderOverlay.hide();
    if (state.errorMessage == null) {
      Common().showSnackBar(
        context,
        '${state.handle} can no longer comment on this post',
      );
      Navigator.pop(context);
    } else {
      Common().showErrorSnackBar(state.errorMessage!);
    }
  }

  void _mainBlocListener(context, MainState state) {
    if (state is AddCommentsState) {
      if (state.parentPostId == _parent.id) {
        _addCommentState(state);
      }
    } else if (state is ReactOnCommentState) {
      _reactOnCommentState(state);
    } else if (state is AddReplyState) {
      setState(() {});
    } else if (state is PaginateCommentsState) {
      if (state.parentId == _parent.id) {
        _paginateCommentsState(state);
      }
    } else if (state is PinACommentResult) {
      if (state.parentPostId == _parent.id) {
        _pinCommentResultState(state);
      }
    } else if (state is MentionsInputResult) {
      _mentionsInputResult(state);
    } else if (state is UpdateCommentParticipationTypeResult) {
      _updateCommentParticipationTypeResult(state);
    } else if (state is ReportCommentState) {
      if (state.parentPostId == _parent.id) {
        _reportCommentState(state);
      }
    } else if (state is DeleteCommentState) {
      if (state.parentPostId == _parent.id) {
        _deleteCommentState(state);
      }
    } else if (state is CommentTrollingDetectedState) {
      _commentTrollingDetected(state);
    } else if (state is DeleteReplyState) {
      _deleteReplyState(state);
    } else if (state is FlagCommentState) {
      _flagCommentState(state);
    } else if (state is BlockUserState) {
      _blockUserState(state);
    } else if (state is BlockCommenterOnPostState) {
      _blockCommenterOnPostState(state);
    } else if (state is GetChallengePinnedCommentState) {
      print('GetChallengePinnedCommentState');
      _commentGxC.pinnedComment = state.challenge?.pinnedComment;
      print(
        '_commentGxC.pinnedComment != null ${_commentGxC.pinnedComment.id}',
      );
      setState(() {});
    } else if (state is GetPostPinnedCommentState) {
      if (state.postId != widget.parent.id) {
        print('GetPostPinnedCommentState returning');
        return;
      }
      _commentGxC.pinnedComment = state.post?.pinnedComment;
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return BlocListener<MainBloc, MainState>(
      listener: _mainBlocListener,
      child: _commentsTab(),
    );
  }

  @override
  void dispose() {
    keyboardSubscription.cancel();
    _inputController.dispose();
    _commentRefreshController.dispose();
    super.dispose();
  }
}

class CommentListTile extends StatefulWidget {
  final int itemIndex;
  final CommentGxC commentGxC;
  final ReplyGxC replyGxC;
  final CurrentUserProfileGxC currentUserGxC;
  final ChallengeOrPost parent;
  final bool canComment;
  final bool isPinned;

  const CommentListTile({
    super.key,
    this.isPinned = false,
    required this.itemIndex,
    required this.commentGxC,
    required this.replyGxC,
    required this.currentUserGxC,
    required this.parent,
    required this.canComment,
  });

  @override
  CommentListTileState createState() => CommentListTileState();
}

class CommentListTileState extends State<CommentListTile> {
  late final CommentGxC _commentGxC = widget.commentGxC;
  late final ReplyGxC _replyGxC = widget.replyGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  bool _isAuthorOfTheComment = false;

  Comment get _comment => widget.isPinned
      ? _commentGxC.pinnedComment
      : _commentGxC.list.value[widget.itemIndex];
  late Widget _content;

  @override
  void initState() {
    super.initState();
  }

  void _reportThisComment({bool? shouldPop}) {
    Common().showReportItBottomSheet(
      context: context,
      reportObjectType: ReportObjectTypeEnum.COMMENT,
      callback: (type) {
        Common().mainBloc(context).add(
              ReportCommentEvent(
                widget.parent.id,
                _comment.id,
                type,
              ),
            );
        if (shouldPop ?? false) {
          Navigator.pop(context);
        }
      },
    );
  }

  void _markAsSelected() {
    // _commentGxC.selectedIndex = widget.itemIndex;
    _commentGxC.selectedCommentId = '';
    setState(() {});
  }

  void _unselect() {
    // _commentGxC.selectedIndex = -1;
    _commentGxC.selectedCommentId = '';
    setState(() {});
  }

  void _deleteThisComment() {
    _markAsSelected();
    Common().showDeleteDialog(
      context,
      object: _appLocalizations.commentsAndReplies_cap_comment,
      onYesTap: () {
        _comment.willBeDeleted = true;
        Common().mainBloc(context).add(
              DeleteCommentEvent(
                widget.parent.id,
                _comment.id,
                widget.itemIndex,
              ),
            );
        setState(() {});
      },
    ).then((value) => _unselect());
  }

  void _pinThisComment() {
    if (_commentGxC.isAuthorOfThePost) {
      final ChallengeOrPost parent = widget.parent;
      if (_commentGxC.pinnedComment.id == _comment.id) {
        Common().mainBloc(context).add(
              PinCommentEvent(
                parent.id,
                '',
                commentBeingUnpinned: _commentGxC.pinnedComment,
                type: parent.runtimeType,
              ),
            );

        _commentGxC.pinnedComment = null;
        parent.pinnedComment = null;
      } else {
        Common().mainBloc(context).add(
              PinCommentEvent(
                parent.id,
                _comment.id,
                index: widget.itemIndex,
                type: parent.runtimeType,
              ),
            );

        parent.pinnedComment = _comment;
        _commentGxC.pinnedComment = _comment;
      }
      setState(() {});
    } else {
      Common().justShowWarningDialog(
        context,
        message: 'Only author of the post can'
            ' ${_textPinOrUnpinned.toLowerCase()} a comment',
      );
    }
  }

  String get _textPinOrUnpinned => (_commentGxC.pinnedComment.id == _comment.id)
      ? _appLocalizations.commentsAndReplies_cap_unPin
      : _appLocalizations.commentsAndReplies_cap_pin;

  void _replyToThisComment() {
    if (_comment.isLocked()) {
      Common().justShowWarningDialog(
        context,
        title: _appLocalizations.commentsAndReplies_lockedComment,
        message: _appLocalizations.commentsAndReplies_lockedCommentMessageReply,
      );
      return;
    }
    if (_commentGxC.replyingToComment?.id != _comment.id) {
      _replyGxC.list.value.clear();
    }
    _commentGxC
      ..replyingToComment = _comment
      ..replyingToCommentBodyWidget = _content;
    if (_commentGxC.currentTab.value == 1) {
      _commentGxC.currentTab.value = 0;
    }
    _commentGxC.currentTab.value = 1;
  }

  Widget _replyText() {
    String str;
    final replyCount = _comment.replyCount;
    if (replyCount > 0) {
      if (replyCount == 1) {
        str = '1 Reply';
      } else {
        str = '$replyCount Replies';
      }
    } else {
      str = 'Reply';
    }
    if (_comment.isLocked()) {
      return Row(
        children: [
          Text(
            str,
            style: TextStyle(
              fontSize: 10.0.sp,
              color: WildrColors.textColor(context),
            ),
          ),
          const SizedBox(
            width: 5,
          ),
          WildrIcon(
            WildrIcons.lock_closed_outline,
            color: Colors.grey,
            size: 11.0.sp,
          ),
        ],
      );
    }
    return Text(
      str,
      style: TextStyle(
        fontSize: 10.0.sp,
        color: CPCommon.subtitleColor(),
      ),
    );
  }

  Widget _leading() => CPCommon.leading(context, _comment.author);

  Widget _trailing() {
    if (widget.isPinned) {
      return const SizedBox();
    }
    return CPCommon.likeButton(
      isLiked: _comment.hasLiked,
      likeCount: _comment.likeCount,
      onLikeButtonPressed: () {
        if (!Common().isLoggedIn(context)) {
          Common().openLoginPage(
            context.router,
            callback: (result) {
              if (Common().isLoggedIn(context)) {
                final ObjectId? objectId;
                if (widget.parent is Post) {
                  objectId = ObjectId.commentFromPost(
                    _comment.id,
                    widget.parent.id,
                  );
                } else {
                  objectId = ObjectId.commentFromChallenge(
                    _comment.id,
                    widget.parent.id,
                  );
                }
                HomePageIntentHandler().handleHomePageIntent(
                  HomePageIntent(HomePageIntentType.COMMENT, objectId),
                  Common().mainBloc(context),
                  context.router,
                );
              }
            },
          );
          Common().showSnackBar(
            context,
            _appLocalizations.commentsAndReplies_loginSignUpToLikeThisComment,
            isDisplayingError: true,
          );
          return;
        }
        if (_comment.hasLiked) {
          Common().mainBloc(context).add(
                ReactOnCommentEvent(
                  _comment.id,
                  liked: false,
                  isChallenge: widget.parent is Challenge,
                ),
              );

          setState(() {
            _comment.hasLiked = false;
            _comment.likeCount--;
          });
        } else if (!_comment.hasLiked) {
          Common().mainBloc(context).add(
                ReactOnCommentEvent(
                  _comment.id,
                  liked: true,
                  isChallenge: widget.parent is Challenge,
                ),
              );

          setState(() {
            _comment.hasLiked = true;
            _comment.likeCount++;
          });
        }
      },
      onLikeCountPressed: () {
        context.pushRoute(
          LikesPageRoute(
            id: _comment.id,
            likeCount: _comment.likeCount,
            type: LikesPageType.COMMENTS,
          ),
        );
      },
    );
  }

  Widget get _pinnedBox => Container(
        padding: const EdgeInsets.fromLTRB(5, 1, 5, 2),
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(
            Radius.circular(5),
          ),
          color: WildrColors.pinnedCommentBgColor(context: context),
        ),
        child: Text(
          _appLocalizations.commentsAndReplies_pinned,
          style: TextStyle(
            fontSize: 9.0.sp,
            color: WildrColors.gray100,
            fontWeight: FontWeight.w400,
          ),
        ),
      );

  Widget _handleAndContent() {
    final List<Widget> topLayer = [CPCommon.handle(context, _comment.author)];
    if (widget.parent is Challenge &&
        widget.parent.author.id == _comment.author.id) {
      topLayer.addAll(
        [
          const SizedBox(width: 5),
          WildrIcon(
            WildrIcons.star_filled,
            size: 14,
            color: WildrColors.textColorSoft(context),
          ),
        ],
      );
    }
    if (widget.isPinned || widget.commentGxC.pinnedComment.id == _comment.id) {
      topLayer.addAll([const SizedBox(width: 5), _pinnedBox]);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 5.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (topLayer.length > 1) Row(children: topLayer) else topLayer.first,
          if (_comment.willBeDeleted)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _content),
                Text(
                  _appLocalizations.commentsAndReplies_deleting,
                  style: TextStyle(
                    color: Colors.red[800],
                    fontSize: 13.0.sp,
                  ),
                ),
              ],
            )
          else
            _content,
        ],
      ),
    );
  }

  Widget _subtitle() => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _comment.ts.time,
            style: TextStyle(
              fontSize: 10.0.sp,
              color: CPCommon.subtitleColor(),
            ),
          ),
          SizedBox(width: 21.0.w),
          InkWell(onTap: _replyToThisComment, child: _replyText()),
        ],
      );

  Widget _commentContent() => ListTile(
        key: ValueKey(_comment.id),
        horizontalTitleGap: 10,
        dense: true,
        selected:
            widget.isPinned || _comment.id == _commentGxC.selectedCommentId,
        selectedTileColor:
            Get.isDarkMode ? WildrColors.gray1000 : Colors.black12,
        onTap: _replyToThisComment,
        leading: _leading(),
        title: _handleAndContent(),
        subtitle: _subtitle(),
        trailing: _trailing(),
      );

  List<Widget> _prepareList(List<SlideActionObj> data) {
    final List<Widget> children = data
        .map(
          (e) => CustomSlidableAction(
            backgroundColor: e.bgColor,
            onPressed: (context) {
              e.callback();
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  e.text,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
                WildrIcon(
                  e.iconPath,
                  color: Colors.white,
                ),
              ],
            ),
          ),
        )
        .toList();

    final List<Widget> finalChildren = [];
    for (int i = 0; i < data.length; i++) {
      finalChildren.add(children[i]);
    }
    return finalChildren;
  }

  void _blockFromCommentingOnPostAction() {
    final textColorStrong = WildrColors.textColorStrong(context);
    Common().showActionSheet(
      context,
      [
        Text(
          'Block ${_comment.author.handle}',
          style: TextStyle(
            color: textColorStrong,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
          textAlign: TextAlign.center,
        ),
        Text(
          _appLocalizations.commentsAndReplies_fromCommentingOnThisPost,
          style: TextStyle(
            color: textColorStrong,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Text(
          '${_comment.author.handle} will not be notified and'
          ' will still be able\nto comment on other posts',
          style: TextStyle(
            color: WildrColors.textColor(context),
            fontSize: 14,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Common().actionSheetDivider(),
        TextButton(
          child: Text(
            _appLocalizations.commentsAndReplies_cap_block,
            style: Common().actionSheetTextStyle(
              color: WildrColors.red,
              fontWeight: FontWeight.w600,
              context: context,
            ),
          ),
          onPressed: () {
            context.loaderOverlay.show();
            Common().mainBloc(context).add(
                  BlockCommenterOnPostEvent(
                    handle: _comment.author.handle,
                    operation: CommenterBlockOperation.BLOCK,
                    commenterId: _comment.author.id,
                    postId: widget.parent.id,
                  ),
                );
          },
        ),
      ],
    );
  }

  Widget _blockFromCommentingOnPostActionSheetItem() => TextButton(
        onPressed: () {
          Navigator.pop(context);
          _blockFromCommentingOnPostAction();
        },
        child: SizedBox(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const WildrIcon(WildrIcons.no_comment),
              const SizedBox(width: 8),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    style: TextStyle(color: WildrColors.textColor(context)),
                    children: <InlineSpan>[
                      TextSpan(
                        text:
                            _appLocalizations.commentsAndReplies_blockWithSpace,
                      ),
                      TextSpan(
                        text: _comment.author.handle,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const TextSpan(text: ' from commenting on this post'),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );

  void _blockUserAction() {
    Navigator.pop(context);
    Common().showActionSheet(
      context,
      [
        Text(
          'Block ${_comment.author.handle}',
          style: TextStyle(
            color: WildrColors.textColorStrong(context),
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
          textAlign: TextAlign.center,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          child: Text(
            '${_comment.author.handle} will not be notified\nand will no longer'
            ' be able to see your profile\nor interact with your posts.',
            style: TextStyle(
              color: WildrColors.textColor(context),
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 10),
        Common().actionSheetDivider(),
        TextButton(
          child: Text(
            _appLocalizations.commentsAndReplies_cap_block,
            style: Common().actionSheetTextStyle(
              color: WildrColors.red,
              fontWeight: FontWeight.w600,
              context: context,
            ),
          ),
          onPressed: () {
            context.loaderOverlay.show();
            Common().mainBloc(context).add(
                  BlockUserEvent(
                    _comment.author.id,
                    pageId: 'comments-page#${widget.parent.id}',
                  ),
                );
          },
        ),
      ],
      // bottomButtonText: 'Continue',
      // bottomButtonColor: WildrColors.sherpaBlue,
      // bottomButtonCallback: () {
      //   context.loaderOverlay.show();
      //   Common().mainBloc(context).add(
      //         BlockUserEvent(
      //           _comment.author.id,
      //           pageId: 'comments-page#${widget.parentPost.id}',
      //         ),
      //       );
      // },
      // backgroundColor: Colors.transparent,
      // bottomButtonFontWeight: FontWeight.bold,
    );
  }

  Widget _blockUserActionSheetItem() => TextButton(
        onPressed: _blockUserAction,
        child: Row(
          children: [
            const WildrIcon(WildrIcons.ban_filled),
            const SizedBox(width: 8),
            Text(
              'Block ${_comment.author.handle} completely',
              style: TextStyle(color: WildrColors.textColor(context)),
            ),
          ],
        ),
      );

  Widget _reportCommentActionSheetItem() => TextButton(
        onPressed: () {
          _reportThisComment(shouldPop: true);
        },
        child: Row(
          children: [
            const WildrIcon(WildrIcons.exclamation_circle_outline),
            const SizedBox(width: 8),
            Text(
              _appLocalizations.commentsAndReplies_reportThisComment,
              style: TextStyle(color: WildrColors.textColor(context)),
            ),
          ],
        ),
      );

  void _unflagComment() {
    setState(() {
      _comment.flagStatus = null;
    });
    Common().mainBloc(context).add(
          FlagCommentEvent(
            operation: FlagCommentOperation.UN_FLAG,
            commentId: _comment.id,
            index: widget.itemIndex,
          ),
        );
  }

  void _flagComment() {
    setState(() {
      _comment.flagStatus = CommentFlagStatus.FLAGGING;
    });
    Common().mainBloc(context).add(
          FlagCommentEvent(
            operation: FlagCommentOperation.FLAG,
            commentId: _comment.id,
            index: widget.itemIndex,
          ),
        );
    Common().showActionSheet(
      context,
      [
        _blockFromCommentingOnPostActionSheetItem(),
        Common().actionSheetDivider(),
        _blockUserActionSheetItem(),
        Common().actionSheetDivider(),
        _reportCommentActionSheetItem(),
      ],
      bottomButtonText: _appLocalizations.commentsAndReplies_undo,
      bottomButtonColor: WildrColors.sherpaBlue,
      bottomButtonCallback: _unflagComment,
      backgroundColor: Colors.transparent,
      bottomButtonFontWeight: FontWeight.bold,
    );
  }

  List<SlideActionObj> _prepareActionsList() {
    final List<SlideActionObj> actions = [];
    if (_commentGxC.isAuthorOfThePost && !_isAuthorOfTheComment) {
      actions.add(
        SlideActionObj(
          text: _appLocalizations.commentsAndReplies_cap_hide,
          iconPath: WildrIcons.eye_off_outline,
          callback: _flagComment,
        ),
      );
    }
    if (!_isAuthorOfTheComment) {
      actions.add(
        SlideActionObj(
          text: _appLocalizations.commentsAndReplies_report,
          iconPath: WildrIcons.exclamation_circle_filled,
          callback: _reportThisComment,
        ),
      );
    }
    if (_commentGxC.isAuthorOfThePost) {
      actions.add(
        SlideActionObj(
          text: _textPinOrUnpinned,
          iconPath: WildrIcons.pin_filled,
          callback: _pinThisComment,
        ),
      );
    }

    final bool canDelete =
        (widget.currentUserGxC.user.id == widget.parent.author.id) ||
            (widget.currentUserGxC.user.id == _comment.author.id);
    if (canDelete) {
      actions.add(
        SlideActionObj(
          text: _appLocalizations.commentsAndReplies_delete,
          iconPath: WildrIcons.trash_filled,
          bgColor: WildrColors.red,
          callback: _deleteThisComment,
        ),
      );
    }

    return actions;
  }

  Widget _commentTile() {
    if (_comment.flagStatus != null) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.only(top: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: const Color(0xff525357),
        ),
        child: Column(
          children: [
            const WildrIcon(
              WildrIcons.check_circle_filled,
              color: Colors.white,
            ),
            const SizedBox(height: 10),
            Text(
              _appLocalizations.commentsAndReplies_thisCommentIsNowHidden,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
            TextButton(
              onPressed: _unflagComment,
              child: Text(
                _appLocalizations.commentsAndReplies_undo,
                style: const TextStyle(color: WildrColors.sherpaBlue),
              ),
            ),
          ],
        ),
      );
    }
    final actions = _prepareActionsList();
    return Slidable(
      endActionPane: ActionPane(
        motion: const DrawerMotion(),
        extentRatio: 0.20 * actions.length,
        children: _prepareList(actions),
      ),
      child: _commentContent(),
    );
  }

  @override
  Widget build(BuildContext context) {
    _isAuthorOfTheComment = widget.currentUserGxC.user.id == _comment.author.id;
    _content = CPCommon.smartBody(_comment.body, _comment.segments, context);
    return AnimatedOpacity(
      opacity: _comment.willBeDeleted ? 0.3 : 1,
      duration: const Duration(milliseconds: 800),
      child: IgnorePointer(
        ignoring: _comment.willBeDeleted,
        child: _commentTile(),
      ),
    );
  }
}

class SlideActionObj {
  final String text;
  final String iconPath;
  final Color bgColor;
  final Function callback;

  SlideActionObj({
    required this.text,
    required this.iconPath,
    required this.callback,
    Color? bgColor,
  }) : bgColor = bgColor ?? const Color(0xff525357);
}

/*
void _lockComment() {
    final lockUnlockStr = _comment.isLocked() ? 'Unlock' : 'Lock';
    final mainBloc mainBloc = Common().mainBloc(context);
    if (_comment.author.id != widget.currentUserGxC.user.id) {
      Common().justShowWarningDialog(
        context,
        message:
            'Only creator of this comment
             can ${lockUnlockStr.toLowerCase()} it',
      );
      return;
    }
    final previousCommentState = _comment;
    final event = UpdateCommentParticipationTypeEvent(
      _comment.id,
      widget.itemIndex,
      _comment.isLocked()
          ? CommentParticipationTypeEnum.OPEN
          : CommentParticipationTypeEnum.FINAL,
      previousCommentState,
    );
    _comment.toggleLockedStatus();
    mainBloc.add(event);
    Navigator.of(context).pop(true);
    setState(() {});
  }
 */
