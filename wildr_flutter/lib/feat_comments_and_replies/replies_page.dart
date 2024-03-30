part of 'comments_page.dart';

class RepliesPage extends StatefulWidget {
  final String parentPageId;
  final BoxDecoration boxDecoration;
  final InputDecoration inputDecoration;
  final EdgeInsets keyboardBasedEdgeInsets;
  final FocusNode focusNode;
  final String? canReplyStr;
  final bool showLoader;
  final String? replyToNavigateToId;
  final String? canViewCommentsStr;
  final ChallengeOrPost parent;

  const RepliesPage({
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
    super.key,
  });

  @override
  RepliesTabState createState() => RepliesTabState();
}

class RepliesTabState extends State<RepliesPage>
    with AutomaticKeepAliveClientMixin<RepliesPage> {
  final replyScrollController = ScrollController();
  late final MentionsInputController _inputController =
      MentionsInputController();
  late final CurrentUserProfileGxC _currentUserGxC =
      Get.find(tag: CURRENT_USER_TAG);
  final RefreshController _replyRefreshController =
      RefreshController(initialRefresh: true);
  late final ReplyGxC _replyGxC;
  late final CommentGxC _commentGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  bool _isFirstTime = true;
  List<SearchMentionResponse> _mentionedResponseList = [];
  MentionedObject? _mentionedObject;
  String? _errorMessage;
  bool _hasPreviousPage = false;
  bool _hasNextPage = false;
  final mentionsScrollController = ScrollController();

  @override
  void initState() {
    _replyGxC = Get.find(tag: widget.parentPageId);
    _commentGxC = Get.find(tag: widget.parentPageId);
    _commentGxC.currentTab.stream.listen((currentTabIndex) {
      if (currentTabIndex == 1) {
        if (mounted) {
          _replyRefreshController.requestRefresh(needMove: false);
          debugPrint(
            'replyGetController.list.value.isNotEmpty ='
            ' ${_replyGxC.list.value.isNotEmpty}',
          );
          if (_replyGxC.list.value.isNotEmpty) {
            _isFirstTime = false;
          }
          setState(() {});
        }
      } else {
        _isFirstTime = true;
        if (mounted) {
          setState(() {});
        }
      }
    });
    super.initState();
  }

  @override
  bool get wantKeepAlive => true;

  //Comment _parentComment() => replyGetController.parentComment.value;
  Comment get _parentComment =>
      _commentGxC.replyingToComment ?? Comment.empty();

  void _clearReplyGetController() {
    _replyGxC.isSendingReply.value = false;
    //replyGetController.list.value.clear();
    //replyGetController.parentComment.value = Comment.empty();
    //commentGetController.currentComment.value = Comment.empty();
    //commentGetController.replyingToCommentIndex = -1;
    _commentGxC.currentTab.value = 0;
    context.router.pop();
  }

  Widget _replyTabAuthor() {
    final child = Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 5),
      child: GestureDetector(
        onTap: () {
          //Common().openProfilePage(context, post.author.id);
        },
        onLongPress: () {
          Clipboard.setData(
            ClipboardData(text: _parentComment.author.handle),
          );
          Common().showSnackBar(
            context,
            _appLocalizations.commentsAndReplies_handleCopiedToClipboard,
          );
        },
        child: ListTile(
          horizontalTitleGap: 0,
          contentPadding: EdgeInsets.zero,
          leading: IconButton(
            padding: EdgeInsets.zero,
            onPressed: _clearReplyGetController,
            icon: const WildrIcon(WildrIcons.chevron_left_outline),
          ),
          title: (_commentGxC.replyingToComment != null)
              ? Row(
                  children: [
                    Common().avatarFromAuthor(
                      context,
                      _parentComment.author,
                      radius: 20.0.r,
                      shouldNavigateToCurrentUser: false,
                    ),
                    const SizedBox(width: 10),
                    Flexible(
                      child: AutoSizeText(
                        _commentGxC.replyingToComment!.author.handle,
                        style: TextStyle(
                          fontSize: 17.0.sp,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                      ),
                    ),
                  ],
                )
              : null,
          // subtitle: _replyTabParentComment(),
        ),
      ),
    );
    return child;
  }

  Widget _replyTabParentComment() => ConstrainedBox(
        constraints:
            BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.2),
        child: Container(
          width: Get.width,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _appLocalizations.commentsAndReplies_replyingTo,
                style:
                    TextStyle(fontSize: 11.0.sp, fontWeight: FontWeight.w400),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Scrollbar(
                  thumbVisibility: true,
                  child: SingleChildScrollView(
                    child: _commentGxC.replyingToCommentBodyWidget!,
                  ),
                ),
              ),
            ],
          ),
        ),
      );

  List<Reply> _repliesList() => _replyGxC.list.value;

  void _onRepliesRefresh() {
    String? includingAndBefore;
    String? targetReplyId;
    if (_isFirstTime) {
      includingAndBefore = widget.replyToNavigateToId;
      targetReplyId = widget.replyToNavigateToId;
    }
    Common().mainBloc(context).add(
          PaginateRepliesEvent(
            _parentComment.id,
            10,
            isRefreshing: true,
            includingAndBefore: includingAndBefore,
            targetReplyId: targetReplyId,
          ),
        );
  }

  void _loadMoreAbove() {
    debugPrint('_loadMoreAbove');
    if (_repliesList().isEmpty) {
      _onRepliesRefresh();
      _replyRefreshController.loadComplete();
    } else {
      Common().mainBloc(context).add(
            PaginateRepliesEvent(
              _parentComment.id,
              10,
              isRefreshing: false,
              before: _repliesList().first.id,
            ),
          );
    }
  }

  void _loadMoreBelow() {
    if (_repliesList().isEmpty) {
      _onRepliesRefresh();
      _replyRefreshController.loadComplete();
    } else {
      Common().mainBloc(context).add(
            PaginateRepliesEvent(
              _parentComment.id,
              10,
              isRefreshing: false,
              after: _repliesList().last.id,
            ),
          );
    }
  }

  Widget _listOfReplies() => SmartRefresher(
        controller: _replyRefreshController,
        onRefresh: _onRepliesRefresh,
        onLoading: _loadMoreBelow,
        enablePullUp: true,
        header: _isFirstTime
            ? const MaterialClassicHeader(height: 0)
            : Common().defaultClassicHeader,
        footer: createEmptyPaginationFooter(),
        child: ListView.builder(
          controller: replyScrollController,
          shrinkWrap: true,
          itemBuilder: (context, index) => ReplyListTile(
            index,
            currentUserGxC: _currentUserGxC,
            commentGxC: _commentGxC,
            parentCommentId: _parentComment.id,
            replyGxC: _replyGxC,
          ),
          itemCount: _repliesList().length,
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        ),
      );

  Widget _mentionsInput() => CPCommon.mentionsInput(
        focusNode: widget.focusNode,
        controller: _inputController,
        onSubmit: _submitReply,
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
              child: _replyGxC.isSendingReply.value
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
                      onPressed: _submitReply,
                      icon: const WildrIcon(
                        WildrIcons.paper_airplane_filled,
                        color: WildrColors.accentColor,
                      ),
                    ),
            ),
          ),
        ),
      );

  Widget _replyTextBox() => Container(
        padding: EdgeInsets.only(
          left: widget.keyboardBasedEdgeInsets.left,
          right: widget.keyboardBasedEdgeInsets.right,
          top: widget.keyboardBasedEdgeInsets.top,
          bottom: widget.canViewCommentsStr == null
              ? widget.keyboardBasedEdgeInsets.bottom
              : MediaQuery.of(context).padding.bottom,
        ),
        decoration: widget.boxDecoration,
        child: Column(
          children: [
            Stack(
              alignment: Alignment.centerRight,
              children: [
                _mentionsInput(),
                _sendButton(),
              ],
            ),
            if (widget.canViewCommentsStr != null && widget.canReplyStr == null)
              Padding(
                padding: const EdgeInsets.only(
                  top: 8,
                ),
                child: Center(
                  child: Text(
                    widget.canViewCommentsStr!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),
                ),
              ),
          ],
        ),
      );

  Widget replyInputBox() {
    final List<Widget> children = [_replyTextBox()];
    if (widget.canReplyStr != null) {
      children.add(
        Positioned.fill(
          child: Blur(
            blur: 1,
            blurColor: Theme.of(context).colorScheme.background,
            child: Container(),
          ),
        ),
      );
      if (_currentUserGxC.isLoggedIn() &&
          !_currentUserGxC.user.shouldShowWildrVerifyBanner) {
        children.add(
          Padding(
            padding: const EdgeInsets.only(top: 25),
            child: widget.showLoader
                ? const Center(
                    child: CupertinoActivityIndicator(),
                  )
                : Center(
                    child: Text(
                      widget.canReplyStr!,
                      textAlign: TextAlign.center,
                    ),
                  ),
          ),
        );
      }
    }
    if (widget.canViewCommentsStr != null && widget.canReplyStr != null) {
      children.add(
        Positioned(
          bottom: 18.0.w,
          left: 0,
          right: 0,
          child: Center(
            child: Text(
              widget.canViewCommentsStr!,
              style: const TextStyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }
    return Column(
      children: [
        if (_currentUserGxC.isLoggedIn() &&
            _currentUserGxC.user.shouldShowWildrVerifyBanner)
          Common().unverifiedUserBanner(_currentUserGxC.user, context),
        Stack(
          children: children,
        ),
      ],
    );
  }

  Widget _loadAboveButton() => Center(
        child: TextButton(
          onPressed: _loadMoreAbove,
          child: Text(
            _appLocalizations.commentsAndReplies_viewPreviousReplies,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: WildrColors.primaryColor,
            ),
          ),
        ),
      );

  Widget _loadBelowButton() => Center(
        child: TextButton(
          onPressed: _loadMoreBelow,
          child: Text(
            _appLocalizations.commentsAndReplies_viewNewerReplies,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: WildrColors.primaryColor,
            ),
          ),
        ),
      );

  Widget _repliesTab() => FooterLayout(
        key: const PageStorageKey('replies'),
        footer: KeyboardAttachable(child: replyInputBox()),
        child: Stack(
          children: [
            Column(
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _replyTabAuthor(),
                    _replyTabParentComment(),
                  ],
                ),
                // _replyTabAuthor(),
                const SizedBox(height: 10),
                if (_hasPreviousPage) _loadAboveButton(),
                Expanded(child: _listOfReplies()),
                if (!_hasPreviousPage && _hasNextPage) _loadBelowButton(),
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

  void _addReplyState(AddReplyState state) {
    if (state.parentCommentId != _commentGxC.replyingToComment?.id) return;
    if (state.errorMessage == null) {
      _replyGxC.isSendingReply.value = false;
      _inputController.clear();
      _repliesList().add(state.reply!);
      _mentionedObject = null;
      _mentionedResponseList = [];
      _errorMessage = null;
      _parentComment.replyCount++;
      _parentComment.ts.updatedAtRaw = state.reply!.ts.updatedAtRaw;
      setState(() {});
    } else {
      _replyGxC.isSendingReply.value = false;
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );
    }
  }

  void _reactOnReplyState(ReactOnReplyState state) {
    if (state.errorMessage != null) {
      Common().showSnackBar(
        context,
        state.errorMessage!,
        isDisplayingError: true,
      );

      // Revert the reply action if there is an error.
      setState(() {
        final reply = _repliesList()
            .firstWhere((reply) => reply.id == state.replyId)
          ..hasLiked = false;
        reply.likeCount--;
      });
    }
  }

  void _paginateRepliesState(PaginateRepliesState state) {
    if (state.parentCommentId != _commentGxC.replyingToComment?.id) return;
    if (state.errorMessage != null) {
      _replyRefreshController.refreshFailed();
      Common().showErrorSnackBar(state.errorMessage!, context);
      setState(() {});
      return;
    }
    _replyRefreshController.refreshCompleted();
    _hasPreviousPage = state.hasPreviousPage;
    _hasNextPage = state.hasNextPage;
    if (state.replies.isEmpty) {
      _isFirstTime = false;
      if (state.targetReplyError != null) {
        Common().showSnackBar(
          context,
          state.targetReplyError!,
        );
      }
      if (state.isRefreshing) {
        _replyRefreshController.refreshCompleted();
      } else {
        _replyRefreshController.loadNoData();
        Future.delayed(const Duration(milliseconds: 500)).then(
          (value) => replyScrollController.animateTo(
            replyScrollController.position.maxScrollExtent - 40,
            duration: const Duration(milliseconds: 500),
            curve: Curves.fastOutSlowIn,
          ),
        );
      }
      setState(() {});
      return;
    }
    _replyRefreshController.loadComplete();
    if (state.isRefreshing) {
      _repliesList().clear();
    }
    if (state.isLoadingAbove) {
      _repliesList().insertAll(0, state.replies);
    } else {
      _repliesList().addAll(state.replies);
    }
    setState(() {});
    if (_isFirstTime) {
      if (widget.replyToNavigateToId != null &&
          widget.replyToNavigateToId!.isNotEmpty) {
        if (state.targetReplyError != null) {
          Common().showSnackBar(
            context,
            state.targetReplyError!,
          );
        } else {
          _replyGxC.selectedIndex = _repliesList().length - 1;
          Common().delayIt(
            () {
              if (replyScrollController.hasClients) {
                replyScrollController.animateTo(
                  replyScrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.fastOutSlowIn,
                );
              } else {
                print('Does not have clients');
              }
              setState(() {});
            },
            millisecond: 500,
          );
          Common().delayIt(
            () {
              setState(() {
                _replyGxC.selectedIndex = -1;
              });
            },
            millisecond: 2000,
          );
        }
      }
    }
    Common().delayIt(() => _isFirstTime = false);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: BlocListener<MainBloc, MainState>(
          bloc: Common().mainBloc(context),
          listener: (context, state) {
            if (state is AddReplyState) {
              _addReplyState(state);
            } else if (state is ReactOnReplyState) {
              _reactOnReplyState(state);
            } else if (state is PaginateRepliesState) {
              _paginateRepliesState(state);
            } else if (state is MentionsInputResult) {
              if (_mentionedObject == null) {
                debugPrint('mentionedObject = null');
                return;
              }
              setState(() {
                _mentionedResponseList = state.response ?? [];
                _errorMessage = state.errorMessage;
              });
            } else if (state is ReportReplyState) {
              if (state.isSuccessful) {
                Common().showSuccessDialog(
                  context,
                  title: _appLocalizations.commentsAndReplies_replyReported,
                  message: reportDoneText,
                );
              } else {
                Common().showErrorSnackBar(state.errorMessage!, context);
              }
            } else if (state is DeleteReplyState) {
              if (!state.isSuccessful) {
                Common().showErrorSnackBar(state.errorMessage!, context);
              }
              if (state.index < _repliesList().length) {
                final replyToDelete = _repliesList()[state.index];
                if (replyToDelete.id == state.replyId) {
                  if (state.isSuccessful) {
                    _replyGxC.list.value.removeAt(state.index);
                    _parentComment.replyCount--;
                    _parentComment.ts.updatedAtRaw = DateTime.now().toString();
                  } else {
                    _replyGxC.list.value[state.index].willBeDeleted = false;
                  }
                  setState(() {});
                  return;
                }
              }
              //Very rare case
              if (state.isSuccessful) {
                _replyGxC.list.value
                    .removeWhere((comment) => comment.id == state.replyId);
              } else {
                _replyGxC.list.value
                    .firstWhere((comment) => comment.id == state.replyId)
                    .willBeDeleted = false;
              }
              setState(() {});
            } else if (state is ReplyTrollingDetectedState) {
              _replyGxC.isSendingReply.value = false;
              Common().showTrollDetectedDialog(
                context,
                object: _appLocalizations.commentsAndReplies_reply,
                onYesTap: () {
                  _replyGxC.isSendingReply.value = true;
                  Common().mainBloc(context).add(
                        AddReplyEvent(
                          _inputController.data,
                          _parentComment.id,
                          negativeConfidenceCount: state.data.negativeCount,
                          shouldBypassTrollDetection: true,
                        ),
                      );
                },
              );
            }
          },
          child: _repliesTab(),
        ),
      ),
    );
  }

  void _submitReply() {
    if (_inputController.text.isBlank ?? true) {
      // Common().showGetSnackBar("Empty field", isDisplayingError: true);
      return;
    }
    _replyGxC.isSendingReply.value = true;
    // print(AddReplyEvent(
    //   _inputController.data,
    //   _parentComment.id,
    // ).getInput());
    Common().mainBloc(context).add(
          AddReplyEvent(
            _inputController.data,
            _parentComment.id,
          ),
        );
  }
}

class ReplyListTile extends StatefulWidget {
  final int itemIndex;
  final CurrentUserProfileGxC currentUserGxC;
  final CommentGxC commentGxC;
  final ReplyGxC replyGxC;
  final String parentCommentId;

  const ReplyListTile(
    this.itemIndex, {
    super.key,
    required this.replyGxC,
    required this.currentUserGxC,
    required this.commentGxC,
    required this.parentCommentId,
  });

  @override
  ReplyListTileState createState() => ReplyListTileState();
}

class ReplyListTileState extends State<ReplyListTile> {
  late final _replyGxC = widget.replyGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Reply get _reply => _replyGxC.list.value[widget.itemIndex];
  late Widget _smartBody;
  bool _isAuthorOfTheReply = false;
  bool _isActionSheetOpen = false;

  @override
  void initState() {
    super.initState();
  }

  Widget _leading() => CPCommon.leading(context, _reply.author);

  Widget _trailing() => CPCommon.likeButton(
        isLiked: _reply.hasLiked,
        likeCount: _reply.likeCount,
        onLikeButtonPressed: () {
          if (!Common().isLoggedIn(context)) {
            Common().openLoginPage(
              context.router,
              callback: (result) {
                if (Common().isLoggedIn(context)) {
                  HomePageIntentHandler().handleHomePageIntent(
                    HomePageIntent(
                      HomePageIntentType.REPLY,
                      ObjectId(
                        commentId: widget.parentCommentId,
                        replyId: _reply.id,
                        postId: _replyGxC.postId,
                        challengeId: _replyGxC.challengeId,
                      ),
                    ),
                    Common().mainBloc(context),
                    context.router,
                  );
                }
                if (result == true) {
                  Common().mainBloc(context).add(
                        PaginateRepliesEvent(
                          widget.parentCommentId,
                          10,
                          isRefreshing: true,
                        ),
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
          if (_reply.hasLiked) {
            Common()
                .mainBloc(context)
                .add(ReactOnReplyEvent(replyId: _reply.id, liked: false));
            setState(() {
              _reply.hasLiked = false;
              _reply.likeCount--;
            });
          } else if (!_reply.hasLiked) {
            Common().mainBloc(context).add(
                  ReactOnReplyEvent(
                    replyId: _reply.id,
                    liked: true,
                  ),
                );

            setState(() {
              _reply.hasLiked = true;
              _reply.likeCount++;
            });
          }
        },
        onLikeCountPressed: () {
          context.pushRoute(
            LikesPageRoute(
              id: _reply.id,
              likeCount: _reply.likeCount,
              type: LikesPageType.REPLIES,
            ),
          );
        },
      );

  Widget _title(Widget smartBody) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CPCommon.handle(context, _reply.author),
          smartBody,
        ],
      );

  Widget _subtitle() => Padding(
        padding: const EdgeInsets.only(top: 5.0),
        child: Text(
          _reply.ts.time,
          style: TextStyle(
            fontSize: 10.0.sp,
            color: CPCommon.subtitleColor(),
          ),
        ),
      );

  void _markAsSelected() {
    _replyGxC.selectedIndex = widget.itemIndex;
    setState(() {});
  }

  void _unselect() {
    _replyGxC.selectedIndex = -1;
    setState(() {});
  }

  void _delete() {
    Common().showDeleteDialog(
      context,
      object: _appLocalizations.commentsAndReplies_cap_reply,
      onYesTap: () {
        _reply.willBeDeleted = true;
        Common().mainBloc(context).add(
              DeleteReplyEvent(
                widget.commentGxC.replyingToComment?.id ?? '',
                _reply.id,
                widget.itemIndex,
              ),
            );
        if (_isActionSheetOpen) {
          Navigator.pop(context);
          _isActionSheetOpen = false;
        }
        setState(() {});
      },
    );
  }

  void _report() {
    Common().showReportItBottomSheet(
      context: context,
      reportObjectType: ReportObjectTypeEnum.REPLY,
      callback: (type) {
        Common().mainBloc(context).add(
              ReportReplyEvent(
                widget.commentGxC.replyingToComment?.id ?? '',
                _reply.id,
                type,
              ),
            );
        if (_isActionSheetOpen) {
          _isActionSheetOpen = false;
          Navigator.pop(context);
          setState(() {});
        }
      },
    );
  }

  Future<bool?> _confirmDismiss(DismissDirection direction) async {
    if (direction == DismissDirection.endToStart) {
      if (_isAuthorOfTheReply) {
        _delete();
      } else {
        _report();
      }
      return false;
    }
    return null;
  }

  ListTile _replyContentListTile() => ListTile(
        contentPadding: EdgeInsets.only(left: 10.0.w, bottom: 5.0.h),
        horizontalTitleGap: 10,
        dense: true,
        selected: widget.itemIndex == _replyGxC.selectedIndex,
        selectedTileColor:
            Get.isDarkMode ? WildrColors.gray1000 : Colors.black12,
        onLongPress: () {
          if (widget.commentGxC.isAuthorOfThePost || _isAuthorOfTheReply) {
            final CurrentUserProfileGxC currentUserGxC =
                Get.find(tag: CURRENT_USER_TAG);
            _showOptions(
              _smartBody,
              _reply.author.id == currentUserGxC.user.id,
            );
          } else {
            Common().showErrorSnackBar(
              _appLocalizations.commentsAndReplies_editableByAuthorOnly,
              context,
            );
          }
        },
        leading: _leading(),
        title: Padding(
          padding: const EdgeInsets.only(right: 10.0),
          child: _title(_smartBody),
        ),
        subtitle: _subtitle(),
        trailing: _trailing(),
      );

  Widget _tile() => Dismissible(
        key: ValueKey(_reply.id),
        dismissThresholds: const {DismissDirection.horizontal: 0.6},
        confirmDismiss: _confirmDismiss,
        background: ColoredBox(
          color: const Color(0xFFD3563F),
          child: Container(),
        ),
        direction: DismissDirection.endToStart,
        secondaryBackground: ColoredBox(
          color: const Color(0xFFD3563F),
          child: Padding(
            padding: EdgeInsets.only(right: 20.0.w),
            child: Align(
              alignment: Alignment.centerRight,
              child: Text(
                _isAuthorOfTheReply
                    ? _appLocalizations.commentsAndReplies_delete
                    : _appLocalizations.commentsAndReplies_report,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
        child: _replyContentListTile(),
      );

  @override
  Widget build(BuildContext context) {
    _smartBody = CPCommon.smartBody(_reply.body, _reply.segments, context);
    _isAuthorOfTheReply = _reply.author.id == widget.currentUserGxC.user.id;
    return AnimatedOpacity(
      opacity: _reply.willBeDeleted ? 0.3 : 1,
      duration: const Duration(milliseconds: 800),
      child: IgnorePointer(ignoring: _reply.willBeDeleted, child: _tile()),
    );
  }

  void _showOptions(Widget smartBody, bool canDelete) {
    _markAsSelected();
    Common().showActionSheet(context, [
      CupertinoActionSheetAction(
        child: Text(
          _appLocalizations.commentsAndReplies_delete,
          style: Common().actionSheetTextStyle(
            color: Colors.red,
            context: context,
          ),
        ),
        onPressed: () {
          _isActionSheetOpen = true;
          _delete();
        },
      ),
      if (!_isAuthorOfTheReply) Common().actionSheetDivider() else Container(),
      if (!_isAuthorOfTheReply)
        CupertinoActionSheetAction(
          child: Text(
            _appLocalizations.commentsAndReplies_report,
            style: Common().actionSheetTextStyle(
              color: Colors.red,
              context: context,
            ),
          ),
          onPressed: () {
            _isActionSheetOpen = true;
            _report();
          },
        )
      else
        Container(),
      //  Common().actionSheetDivider(),
    ]).then((value) {
      _unselect();
    });
  }
}
