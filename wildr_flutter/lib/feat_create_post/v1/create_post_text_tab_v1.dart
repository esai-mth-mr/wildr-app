// ignore_for_file: cascade_invocations

part of 'create_post_page_v1.dart';

const MAX_WORD_COUNT = 120;

class CreateTextTabV1 extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final bool isEditMode;
  final TextPostData? editTextPostData;
  final FocusNode focusNode;
  final Challenge? defaultSelectedChallenge;

  const CreateTextTabV1({
    required this.createPostGxC,
    this.isEditMode = false,
    this.editTextPostData,
    required this.focusNode,
    this.defaultSelectedChallenge,
    super.key,
  });

  @override
  CreateTextTabV1State createState() => CreateTextTabV1State();
}

class CreateTextTabV1State extends State<CreateTextTabV1> {
  late CreateTextPostGetController _createTextPostGxC;
  MentionsInputController _inputController = MentionsInputController();
  List<SearchMentionResponse> _mentionedResponseList = [];
  MentionedObject? _mentionedObject;
  String? _errorMessage;
  double _bottomPaddingWithoutKeyboard = 0;
  bool _animateWordLimitForError = false;
  late double bottomPadding = MediaQuery.of(context).padding.bottom;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    if (widget.isEditMode) {
      debugPrint(
        'Edit Mode me Length = ${widget.editTextPostData!.blocks?.length}',
      );
      Get.put(CreateTextPostGetController(), tag: 'Editing');
      _createTextPostGxC = Get.find(tag: 'Editing');
      _inputController = MentionsInputController(
        text: widget.editTextPostData!.body,
      );
      _inputController.blocks = widget.editTextPostData!.blocks ?? [];
      final length = _inputController.text.split(' ').length;
      if (length == 1 && _inputController.text.isEmpty) {
        _createTextPostGxC.wordCount = 0;
      } else {
        _createTextPostGxC.wordCount = length;
      }
      super.initState();
    } else {
      super.initState();
      Get.put(CreateTextPostGetController());
      _createTextPostGxC = Get.find();
    }
    Future.delayed(const Duration(milliseconds: 500)).then((value) {
      if (mounted) {
        _bottomPaddingWithoutKeyboard = MediaQuery.of(context).padding.bottom;
        if (_bottomPaddingWithoutKeyboard == 0) {
          _bottomPaddingWithoutKeyboard = 30;
        }
      }
    });
  }

  bool _wordLimitProblem() {
    if (_createTextPostGxC.wordCount > MAX_WORD_COUNT) {
      Common().showSnackBar(
        context,
        _appLocalizations.createPost_wordLimitExceeded,
        isDisplayingError: true,
      );

      setState(() {
        _animateWordLimitForError = true;
      });
      return true;
    }
    return false;
  }

  Future<bool> _addAnotherTextPostPage() async {
    if (_wordLimitProblem()) return false;
    if (widget.createPostGxC.postCount == 5) {
      Common().showErrorSnackBar(
        _appLocalizations.createPost_postLimitReached,
        context,
      );
      return false;
    }
    if (_createTextPostGxC.isLoading) {
      return false;
    }
    if (_inputController.text.isEmpty) {
      widget.createPostGxC.animateCounter.value = true;
      widget.createPostGxC.opacityEnabled.value = false;
      return false;
    }

    _createTextPostGxC.isLoading = true;
    final TextPostData postData = TextPostData()
      ..data = _inputController.data
      ..body = _inputController.text;
    debugPrint(postData.data);
    final blocks = _inputController.blocks;
    postData.blocks = [];
    postData.blocks!.addAll(blocks);
    postData.segments = _segments();
    widget.createPostGxC.addPostData(postData);
    _inputController
      ..clear()
      ..clearComposing();
    _createTextPostGxC.clear();
    widget.createPostGxC.animateCounter.value = true;
    widget.createPostGxC.opacityEnabled.value = false;
    if (_textAndPreviewFieldIndex == 1) {
      _textAndPreviewFieldIndex = 0;
      setState(() {});
      await Future.delayed(const Duration(milliseconds: 500));
    } else {
      setState(() {});
    }
    return true;
  }

  Widget _addAnotherTextPostPageButton(bool shouldShowAddButton) =>
      shouldShowAddButton
          ? CreatePostCommon().addButton(onPressed: _addAnotherTextPostPage)
          : Container(height: 1);

  Future<void> _onDone() async {
    if (_inputController.text.isEmpty) {
      if (widget.createPostGxC.editIndex > -1) {
        widget.createPostGxC.posts.removeAt(widget.createPostGxC.editIndex);
      } else {
        debugPrint('❌❌ _onDone `widget.createPostGxC.editIndex > -1 = false`');
      }
      Navigator.of(context).pop();
      return;
    }
    if (_wordLimitProblem()) {
      return;
    }
    final TextPostData postData = widget.editTextPostData!
      ..data = _inputController.data
      ..body = _inputController.text
      ..blocks = _inputController.blocks
      ..segments = _segments();
    widget.createPostGxC.posts[widget.createPostGxC.editIndex] = postData;
    _createTextPostGxC.clear();
    Navigator.of(context).pop();
  }

  Widget _doneButton() => CreatePostCommon().bottomRightButton(
        onPressed: _onDone,
        text: _appLocalizations.comm_cap_done,
      );

  Future<void> _onNext() async {
    widget.focusNode.unfocus();
    setState(() {});
    // FIRST TIME
    if (_inputController.text.isEmpty && widget.createPostGxC.postCount == 0) {
      return;
    }
    if (_wordLimitProblem()) return;
    if (widget.createPostGxC.postCount == 5 ||
        (widget.createPostGxC.postCount > 0 && _inputController.text.isEmpty)) {
      await context
          .pushRoute(
            UploadMultiMediaPostV1Route(
              createPostGxC: widget.createPostGxC,
              defaultSelectedChallenge: widget.defaultSelectedChallenge,
            ),
          )
          .then(_dotThen);
      return;
    }
    if (await _addAnotherTextPostPage()) {
      await context
          .pushRoute(
            UploadMultiMediaPostV1Route(
              createPostGxC: widget.createPostGxC,
              defaultSelectedChallenge: widget.defaultSelectedChallenge,
            ),
          )
          .then(_dotThen);
    }
  }

  void _dotThen(Object? value) {
    debugPrint('CREATE POST TEXT TAB $value');
    if (value == SHOULD_CALL_SET_STATE) {
      setState(() {});
    } else if (value == POP_CURRENT_PAGE) {
      Common().mainBloc(context).add(CloseCreatePostPageEvent());
    } else if (value == ADD_ANOTHER_POST) {
      widget.createPostGxC.animateCounter.value = true;
      widget.createPostGxC.opacityEnabled.value = false;
    }
  }

  Widget _nextButton() => Opacity(
        opacity:
            _inputController.text.isEmpty && widget.createPostGxC.postCount == 0
                ? 0.5
                : 1,
        child: CreatePostCommon().bottomRightButton(
          onPressed: _onNext,
        ),
      );

  Widget _buttons() => CreatePostCommon().bottomButtonsRow(
        _addAnotherTextPostPageButton(widget.createPostGxC.postCount <= 4),
        widget.isEditMode ? _doneButton() : _nextButton(),
      );

  double get _searchListHeight => Get.height * 0.2;

  Widget _searchList() => Container(
        width: Get.width - 15.0.w,
        height: _searchListHeight,
        padding: const EdgeInsets.only(left: 4, right: 4, bottom: 5),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: WildrColors.isLightMode(context)
              ? const Color.fromRGBO(244, 244, 244, 1)
              : WildrColors.bgColorDark,
          boxShadow: const [
            BoxShadow(
              color: WildrColors.primaryColor,
              spreadRadius: 3,
            ),
          ],
        ),
        child: Stack(
          children: [
            if (_mentionedResponseList.isEmpty)
              Center(
                child: _errorMessage == null
                    ? const CupertinoActivityIndicator()
                    : Text(_errorMessage!),
              )
            else
              SmartTextCommon().mentionsListV1(
                _mentionedResponseList,
                _inputController,
                _mentionedObject!,
                onInsertion: () {
                  _mentionedObject = null;
                  _mentionedResponseList = [];
                  setState(() {});
                },
              ),
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                alignment: Alignment.topRight,
                padding: const EdgeInsets.only(right: 10, top: 10),
                onPressed: () {
                  _mentionedObject = null;
                  _mentionedResponseList = [];
                  setState(() {});
                },
                icon: const WildrIcon(
                  WildrIcons.x_outline,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      );

  double _bottomPaddingOfTextField() {
    final double bottomInset = MediaQuery.of(context).viewInsets.bottom;

    double numberToSubtract = 0;
    if (_bottomPaddingWithoutKeyboard == 30) {
      numberToSubtract = _bottomPaddingWithoutKeyboard * 1.5;
    } else {
      numberToSubtract = _bottomPaddingWithoutKeyboard * 2;
    }
    if (bottomInset > 0) {
      return max(
        bottomInset - numberToSubtract,
        0,
      );
    } else {
      return 15;
    }
  }

  Widget _textField() => Container(
        color: WildrColors.textPostBGColor(context),
        padding: EdgeInsets.only(
          left: 10.0.w,
          right: 10.0.w,
          top: 8.0.h,
          bottom: _bottomPaddingOfTextField(),
        ),
        child: Obx(
          () => MentionsInput(
            focusNode: widget.focusNode,
            controller: _inputController,
            autofocus: widget.isEditMode,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 18..sp,
              color: WildrColors.isLightMode(context)
                  ? Colors.grey[800]
                  : Colors.white,
            ),
            expands: true,
            textCapitalization: TextCapitalization.sentences,
            keyboardAppearance: Theme.of(context).brightness,
            onChanged: (t) {
              final text = _inputController.text;
              if (text.isEmpty) {
                _mentionedObject = null;
                _mentionedResponseList = [];
                setState(() {});
              }
              final length = text.split(RegExp(r' |[\n ]')).length;
              if (length == 1 && text.isEmpty) {
                _createTextPostGxC.wordCount = 0;
              } else {
                _createTextPostGxC.wordCount = length;
              }
              if (text.isEmpty) {
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
            decoration: InputDecoration(
              fillColor: WildrColors.textColor(),
              focusedBorder: InputBorder.none,
              enabledBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              hintStyle: TextStyle(
                fontWeight: FontWeight.w500,
                color: WildrColors.isLightMode(context)
                    ? Colors.grey
                    : Colors.white,
                fontSize: 18..sp,
              ),
              hintText: _appLocalizations.createPost_whatsOnYourMind,
              counter: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ScaleAnimatedWidget.tween(
                    animationFinished: (value) {
                      Future.delayed(const Duration(milliseconds: 200))
                          .then((value) {
                        setState(() {
                          _animateWordLimitForError = false;
                        });
                      });
                    },
                    duration: const Duration(milliseconds: 200),
                    scaleDisabled: 1,
                    scaleEnabled: 2,
                    enabled: _animateWordLimitForError,
                    child: Text(
                      '${_createTextPostGxC.wordCount} / $MAX_WORD_COUNT',
                      style: TextStyle(
                        color: (_createTextPostGxC.wordCount > MAX_WORD_COUNT)
                            ? Colors.red
                            : WildrColors.isLightMode(context)
                                ? Colors.grey[500]
                                : Colors.white54,
                      ),
                    ),
                  ),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    child: Text(
                      (widget.focusNode.hasFocus)
                          ? _appLocalizations.comm_cap_done
                          : '',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: WildrColors.isLightMode(context)
                            ? Colors.grey[500]
                            : Colors.white,
                      ),
                    ),
                    onPressed: () {
                      widget.focusNode.unfocus();
                      setState(() {});
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      );

  int _textAndPreviewFieldIndex = 0;

  List<Segment> _segments({bool shouldGenerate = true}) {
    if (shouldGenerate) {
      return SmartTextCommon().createSegmentsFromTextEditorData(
        _inputController.data,
        _inputController.blocks,
        body: _inputController.text,
      );
    }
    return [];
  }

  Widget _textAndPreviewField() => _textField();

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is PostCreationErrorState) {
      Common().showSnackBar(context, state.message, isDisplayingError: true);
    } else if (state is PostCreationSuccessfulState) {
      Navigator.of(context).pop();
    } else if (state is MentionsInputResult) {
      if (_mentionedObject == null) {
        debugPrint('mentionedObject = null');
        return;
      }
      setState(() {
        _mentionedResponseList = state.response ?? [];
        _errorMessage = state.errorMessage;
      });
    }
  }

  void _closeKeyboard() {
    widget.focusNode.unfocus();
    setState(() {});
  }

  Widget _textFieldWithCalculatedPadding() => Padding(
        padding: EdgeInsets.only(
          bottom: _mentionedObject != null
              ? max(
                  MediaQuery.of(context).viewInsets.bottom - _searchListHeight,
                  0,
                )
              : 0,
        ),
        child: _textAndPreviewField(),
      );

  Widget _searchListWithCalculatedPadding() => Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: EdgeInsets.only(
            bottom: max(
              MediaQuery.of(context).viewInsets.bottom - bottomPadding - 50,
              0,
            ),
          ),
          child: _searchList(),
        ),
      );

  Widget _textFieldAndMentionsInputList() => Expanded(
        child: Stack(
          children: [
            _textFieldWithCalculatedPadding(),
            if (_mentionedObject != null) _searchListWithCalculatedPadding(),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: _mainBlocListener,
        child: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onVerticalDragEnd: (event) {
            _closeKeyboard();
          },
          onTap: _closeKeyboard,
          child: SafeArea(
            bottom: false,
            child: Column(
              children: [
                _textFieldAndMentionsInputList(),
                SizedBox(height: 5.0.w),
                Padding(
                  padding: EdgeInsets.only(
                    bottom: _getBottomPadding(),
                  ),
                  child: _buttons(),
                ),
              ],
            ),
          ),
        ),
      );

  double _getBottomPadding() {
    if (Platform.isAndroid) {
      return bottomPadding.h + Get.height * 0.02;
    } else {
      if (bottomPadding.h == 0.0) {
        return bottomPadding.h + Get.height * 0.02;
      } else {
        return bottomPadding.h;
      }
    }
  }

  @override
  void dispose() {
    _createTextPostGxC.clear();
    _inputController.dispose();
    super.dispose();
  }
}
