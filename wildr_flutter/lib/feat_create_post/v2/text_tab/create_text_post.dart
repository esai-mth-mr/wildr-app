// ignore_for_file: unused_element

import 'dart:io';
import 'dart:math';

import 'package:animated_widgets/widgets/scale_animated.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/gxc/create_text_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/gxc/text_post_background_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/create_text_post/selected_background_preview.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/create_text_post/text_post_bg_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/create_text_post/text_post_troll_detection_bottom_sheet.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

const MAX_CHAR_COUNT = 850;

class CreateTextPost extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final bool isEditMode;
  final TextPostData? editTextPostData;
  final Challenge? defaultSelectedChallenge;

  const CreateTextPost({
    required this.createPostGxC,
    this.isEditMode = false,
    this.editTextPostData,
    this.defaultSelectedChallenge,
    super.key,
  });

  @override
  State<CreateTextPost> createState() => _CreateTextPostState();
}

class _CreateTextPostState extends State<CreateTextPost> {
  late CreateTextPostGetController _createTextPostGxC;
  MentionsInputController _inputController = MentionsInputController();
  List<SearchMentionResponse> _searchResults = [];
  MentionedObject? _mentionedObject;

  late FocusNode _focusNode;
  String? _errorMessage;
  double _bottomPaddingWithoutKeyboard = 0;
  bool _animateWordLimitForError = false;
  late double bottomPadding = MediaQuery.of(context).padding.bottom;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final TextPostBackgroundGxc _textPostBackgroundGxc =
      Get.put(TextPostBackgroundGxc());
  TextAlign _textAlignment = TextAlign.left;
  bool _isShowingToast = false;

  @override
  void initState() {
    _focusNode = FocusNode();
    if (widget.isEditMode) {
      Get.put(CreateTextPostGetController(), tag: 'Editing');
      _createTextPostGxC = Get.find(tag: 'Editing');
      _inputController =
          MentionsInputController(text: widget.editTextPostData!.body);
      _inputController.blocks = widget.editTextPostData!.blocks ?? [];
      final length = _inputController.text.length;
      if (length == 0) {
        _createTextPostGxC.charCount = 0;
      } else {
        _createTextPostGxC.charCount = length;
      }
      super.initState();
    } else {
      super.initState();
      Get.put(CreateTextPostGetController());
      _createTextPostGxC = Get.find();
    }
    Future.delayed(const Duration(milliseconds: 500)).then((value) {
      _bottomPaddingWithoutKeyboard = MediaQuery.of(context).padding.bottom;
      if (_bottomPaddingWithoutKeyboard == 0) {
        _bottomPaddingWithoutKeyboard = 30;
      }
    });
  }

  bool get _isKeyboardOpen => MediaQuery.of(context).viewInsets.bottom > 0;

  double get _searchListHeight => Get.height * 0.11;

  void _showTextPostTrollDetectionBottomSheet(TrollData? trollData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: TextPostTrollDetectionBottomSheet(
          title: _appLocalizations.createPost_aiToxicityWarningMessage,
          subTitle: _appLocalizations.createPost_ringColorImpactExplanation,
          btnTitle: _appLocalizations.createPost_reviewUpperCase,
          onPressed: () {
            Navigator.pop(context);
          },
          secondButtonTitle: _appLocalizations.challenge_continueAnyways,
          secondButtonOnPressed: () {
            Navigator.pop(context);
            _addPost(
              isTrollDetected: true,
              negative: trollData!.confidence!.negative,
            );
          },
        ),
      ),
    );
  }

  void _handleMainState(BuildContext context, MainState state) {
    if (state is PostCreationErrorState) {
      Common().showSnackBar(context, state.message, isDisplayingError: true);
    } else if (state is PostCreationSuccessfulState) {
      context.popRoute();
    } else if (state is MentionsInputResult) {
      if (_mentionedObject == null) {
        debugPrint('mentionedObject = null');
        return;
      }
      setState(() {
        _searchResults = state.response ?? [];
        _errorMessage = state.errorMessage;
      });
    } else if (state is TextPostTrollDetectionState) {
      debugPrint('data');
      context.loaderOverlay.hide();
      if (state.errorMessage != null) {
        Common().showSnackBar(
          context,
          state.errorMessage!,
          isDisplayingError: true,
        );
      } else if (state.trollResult != null &&
          state.trollResult!.trollDetectionData != null &&
          state.trollResult!.trollDetectionData!.text != null &&
          state.trollResult!.trollDetectionData!.text!.isNotEmpty) {
        _showTextPostTrollDetectionBottomSheet(
          state.trollResult!.trollDetectionData!,
        );
      } else {
        _addPost();
      }
    }
  }

  void _textAlignChange() {
    setState(() {
      if (_textAlignment == TextAlign.left) {
        _textAlignment = TextAlign.center;
      } else if (_textAlignment == TextAlign.center) {
        _textAlignment = TextAlign.right;
      } else if (_textAlignment == TextAlign.right) {
        _textAlignment = TextAlign.left;
      }
    });
  }

  void _closeKeyboard() {
    _focusNode.unfocus();
    setState(() {});
  }

  void _addPost({bool isTrollDetected = false, double negative = 0}) {
    final TextPostData postData = TextPostData()
      ..data = _inputController.data
      ..body = _inputController.text
      ..blocks = _inputController.blocks
      ..segments = _segments()
      ..isTrollDetected = isTrollDetected
      ..negative = negative;
    widget.createPostGxC.addPostData(postData);
    widget.createPostGxC.update();

    context.popRoute();
  }

  bool _didExceedWordLimit() => _createTextPostGxC.charCount > MAX_CHAR_COUNT;

  void _onWordLimitExceeded() {
    Common().showGetSnackBar(
      _appLocalizations.createPost_reachedWordLimit,
      snackPosition: SnackPosition.TOP,
    );
    HapticFeedback.vibrate();
    setState(() {
      _animateWordLimitForError = true;
    });
  }

  double _bottomPaddingOfTextField() {
    final double keyboardBottomInset = MediaQuery.of(context).viewInsets.bottom;
    double paddingToSubtract = 0;
    if (_bottomPaddingWithoutKeyboard == 30) {
      paddingToSubtract = _bottomPaddingWithoutKeyboard * 1.5;
    } else {
      paddingToSubtract = _bottomPaddingWithoutKeyboard * 2;
    }
    if (keyboardBottomInset > 0) {
      return max(keyboardBottomInset - paddingToSubtract, 0) +
          (_isKeyboardOpen && _mentionedObject != null ? Get.height * 0.1 : 0);
    } else {
      return 15 +
          (_isKeyboardOpen && _mentionedObject != null ? Get.height * 0.1 : 0);
    }
  }

  Color getContrastColorFromLinearGradient(LinearGradient gradient) {
    final List<Color> colors = gradient.colors;
    final int numColors = colors.length;
    final int midpoint = numColors ~/ 2;
    final Color midpointColor = colors[midpoint];
    final double luminance = midpointColor.computeLuminance();
    return luminance > 0.5 ? WildrColors.black : WildrColors.white;
  }

  Color getContrastColor(Color bgColor) {
    final double bgLuminance = (0.2126 * bgColor.red +
            0.7152 * bgColor.green +
            0.0722 * bgColor.blue) /
        255;
    final double whiteContrast = (1 + 0.05) / (bgLuminance + 0.05);
    final double blackContrast = (bgLuminance + 0.05) / 0.05;
    return whiteContrast > blackContrast
        ? WildrColors.white
        : WildrColors.black;
  }

  BoxDecoration _getBoxDecoration() {
    if (_textPostBackgroundGxc.textPostBGEnum ==
        TextPostBackgroundType.GRADIENT) {
      return BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: _textPostBackgroundGxc.textPostBGColorGradient,
        ),
      );
    } else {
      return BoxDecoration(
        color:
            _textPostBackgroundGxc.textPostCustomBGColor == Colors.transparent
                ? WildrColors.createPostBGColor(context)
                : _textPostBackgroundGxc.textPostCustomBGColor,
      );
    }
  }

  Color _getTextColor() {
    if (_textPostBackgroundGxc.textPostBGEnum ==
        TextPostBackgroundType.GRADIENT) {
      return getContrastColorFromLinearGradient(
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: _textPostBackgroundGxc.textPostBGColorGradient,
        ),
      );
    } else {
      return getContrastColor(_textPostBackgroundGxc.textPostCustomBGColor);
    }
  }

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

  Future<void> _onDone() async {
    if (_inputController.text.isEmpty) {
      if (widget.createPostGxC.editIndex > -1) {
        widget.createPostGxC.posts.removeAt(widget.createPostGxC.editIndex);
      } else {
        debugPrint('❌❌ _onDone `widget.createPostGxC.editIndex > -1 = false`');
      }
      await context.popRoute();
      return;
    }
    if (_didExceedWordLimit()) {
      _onWordLimitExceeded();
      return;
    }
    final TextPostData postData = widget.editTextPostData!
      ..data = _inputController.data
      ..body = _inputController.text
      ..blocks = _inputController.blocks
      ..segments = _segments();
    widget.createPostGxC.posts[widget.createPostGxC.editIndex] = postData;
    _createTextPostGxC.clear();
    await context.popRoute();
  }

  Future<void> _onNext() async {
    _focusNode.unfocus();
    setState(() {});
    // FIRST TIME
    if (_inputController.text.trim().isEmpty) {
      Common()
          .showSnackBar(context, _appLocalizations.createPost_enterTextFirst);
      return;
    }
    if (_didExceedWordLimit()) {
      _onWordLimitExceeded();
      return;
    }
    context.loaderOverlay.show();
    Common().mainBloc(context).add(
          CheckTextPostTroll(textPostContent: _inputController.text),
        );
  }

  Widget _mentionDataList() {
    if (_mentionedObject!.type == ESSearchType.HASHTAGS &&
        _searchResults[0].user != null) {
      return const Center(child: CircularProgressIndicator());
    } else {
      if (_mentionedObject!.type == ESSearchType.USER &&
          _searchResults[0].user == null) {
        return const Center(child: CircularProgressIndicator());
      } else {
        return SmartTextCommon().mentionsList(
          _searchResults,
          shouldShowRing: false,
          _inputController,
          _mentionedObject!,
          handleColor: WildrColors.white,
          onInsertion: () {
            _mentionedObject = null;
            setState(() {});
          },
        );
      }
    }
  }

  Widget _searchList() => Container(
        height: _searchListHeight,
        padding: const EdgeInsets.only(left: 4, right: 4, bottom: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.0),
              Colors.black.withOpacity(0.5491),
              Colors.black.withOpacity(0.79),
            ],
            stops: const [
              0.0,
              0.5491,
              0.79,
            ], // Corresponding stops for the colors
          ),
        ),
        child: _searchResults.isEmpty
            ? Center(
                child: _errorMessage == null
                    ? const CupertinoActivityIndicator()
                    : Text(_errorMessage!),
              )
            : _mentionDataList(),
      );

  Widget _charCounter() => Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          ScaleAnimatedWidget.tween(
            animationFinished: (value) {
              Future.delayed(const Duration(milliseconds: 200)).then((value) {
                setState(() {
                  _animateWordLimitForError = false;
                });
              });
            },
            duration: const Duration(milliseconds: 200),
            scaleDisabled: 1,
            scaleEnabled: 2,
            enabled: _animateWordLimitForError,
            child: _isKeyboardOpen ? const SizedBox() : _charCountText(),
          ),
        ],
      );

  Widget _charCountText() => Text(
        '${_createTextPostGxC.charCount} / $MAX_CHAR_COUNT',
        style: TextStyle(
          color: (_createTextPostGxC.charCount > MAX_CHAR_COUNT)
              ? WildrColors.red
              : WildrColors.isLightMode(context)
                  ? WildrColors.gray500
                  : Colors.white54,
        ),
      );

  Widget _textAndPreviewField() => Container(
        decoration: BoxDecoration(
          color: WildrColors.blankPostAddColor(context),
        ),
        padding: EdgeInsets.only(
          left: 15,
          right: 15,
          top: 18,
          bottom: _bottomPaddingOfTextField(),
        ),
        child: Obx(
          () => MentionsInput(
            focusNode: _focusNode,
            controller: _inputController,
            autofocus: true,
            textAlign: _textAlignment,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 18..sp,
              color: WildrColors.lightDarkTextModeColor(context),
            ),
            expands: true,
            maxLength: MAX_CHAR_COUNT,
            textCapitalization: TextCapitalization.sentences,
            keyboardAppearance: Theme.of(context).brightness,
            onChanged: (t) {
              final text = _inputController.text;
              if (text.isEmpty) {
                _mentionedObject = null;
                setState(() {});
              }
              //final length = text.split(RegExp(r' |[\n ]')).length;
              final length = text.length;
              if (length == 0) {
                _createTextPostGxC.charCount = 0;
              } else {
                _createTextPostGxC.charCount = length;
              }
              if (text.isEmpty) {
                return;
              }
              _mentionedObject =
                  SmartTextCommon().performTagsAndMentionedDetectionAndSearch(
                _inputController,
                _mentionedObject,
                Common().mainBloc(context),
              );
              if (!_isShowingToast && text.length >= MAX_CHAR_COUNT) {
                _isShowingToast = true;
                Common().showGetSnackBar(
                  _appLocalizations.createPost_reachedWordLimit,
                  showIcon: true,
                  snackPosition: SnackPosition.TOP,
                );
              } else if (text.length < MAX_CHAR_COUNT) {
                _isShowingToast = false;
              }
              setState(() {});
            },
            decoration: InputDecoration(
              fillColor: WildrColors.textColor(context),
              focusedBorder: InputBorder.none,
              enabledBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              hintStyle: TextStyle(
                fontWeight: FontWeight.w500,
                color: WildrColors.isLightMode(context)
                    ? WildrColors.gray500
                    : WildrColors.white,
                fontSize: 18..sp,
              ),
              hintText: _appLocalizations.createPost_whatsOnYourMind,
              counter: _charCounter(),
            ),
          ),
        ),
      );

  Widget _scaleAnimatedWordCountLabel() => ScaleAnimatedWidget.tween(
        animationFinished: (value) {
          Future.delayed(
            const Duration(
              milliseconds: 200,
            ),
          ).then((value) {
            setState(() {
              _animateWordLimitForError = false;
            });
          });
        },
        duration: const Duration(
          milliseconds: 200,
        ),
        scaleDisabled: 1,
        scaleEnabled: 2,
        enabled: _animateWordLimitForError,
        child: Text(
          '${_createTextPostGxC.charCount} / $MAX_CHAR_COUNT',
          style: TextStyle(
            color: (_createTextPostGxC.charCount > MAX_CHAR_COUNT)
                ? WildrColors.red
                : WildrColors.isLightMode(context)
                    ? WildrColors.gray500
                    : Colors.white54,
          ),
        ),
      );

  Widget _backgroundSelectorButton() => InkWell(
        onTap: () async => await showModalBottomSheet(
          barrierColor: WildrColors.black.withOpacity(0.6),
          context: context,
          backgroundColor: WildrColors.gray1200,
          builder: (context) => const TextPostSelectBGBottomSheet(),
        ),
        child: Obx(
          () => SelectedBackgroundPreview(
            colorGradient: _textPostBackgroundGxc.textPostBGColorGradient,
            backgroundColor: _textPostBackgroundGxc.textPostCustomBGColor,
          ),
        ),
      );

  Widget _textAlignmentIconButton() => IconButton(
        onPressed: () => _textAlignChange(),
        icon: WildrIcon(
          WildrIcons.alignmentIcon,
          color: WildrColors.createPostButtonTextColor(context),
          size: 24,
        ),
      );

  Widget _bottomBarContent() => Container(
        height: 46,
        alignment: Alignment.centerLeft,
        width: double.infinity,
        color: WildrColors.addPostColor(context),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0.w),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              //This Code is commented because we are not implementing
              // alignment and background for text post for now
              /*   _textAlignmentIconButton(),
            SizedBox(width: 15.0.w),
            _backgroundSelectorButton(),
            SizedBox(width: 15.0.w),*/
              _scaleAnimatedWordCountLabel(),
            ],
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

  Widget _bottomKeyboardTopAttachedView() {
    if (MediaQuery.of(context).viewInsets.bottom <= 0) {
      return const SizedBox();
    }

    return Align(
      alignment: Alignment.bottomCenter,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: max(
            MediaQuery.of(context).viewInsets.bottom - _getBottomPadding() - 60,
            0,
          ),
        ),
        child: _bottomBarContent(),
      ),
    );
  }

  Widget _mentionList() {
    if (_mentionedObject != null && _isKeyboardOpen) {
      return _searchList();
    }
    return Container();
  }

  Widget _postTextField() => Padding(
        padding: EdgeInsets.symmetric(
          vertical: 10.0.h,
          horizontal: 16.0.w,
        ),
        child: Common().clipIt(
          radius: 16.0,
          child: _textAndPreviewField(),
        ),
      );

  Widget _doneBtn() {
    if (_isKeyboardOpen) {
      return Positioned(
        top: 22,
        right: 28,
        child: GestureDetector(
          onTap: () {
            SystemChannels.textInput.invokeMethod('TextInput.hide');
            _closeKeyboard();
          },
          child: Text(
            _appLocalizations.comm_cap_done,
            style: TextStyle(
              color: WildrColors.createPostButtonTextColor(context),
              fontSize: 14.0.sp,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );
    }
    return Container();
  }

  Widget _buttons() => CreatePostCommon().bottomButtonsRow(
        widget.isEditMode
            ? const SizedBox()
            : DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: WildrColors.blankPostAddColor(context),
                ),
                child: IconButton(
                  icon: const WildrIcon(
                    WildrIcons.deleteIcon,
                    size: 20,
                  ),
                  onPressed: () {
                    context.popRoute();
                  },
                ),
              ),
        SizedBox(
          width: 100.0.w,
          height: Get.height * 0.05,
          child: ElevatedButton(
            onPressed: widget.isEditMode ? _onDone : _onNext,
            style: ElevatedButton.styleFrom(
              foregroundColor: WildrColors.createPostButtonTextColor(context),
              backgroundColor: WildrColors.blankPostAddColor(context),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15.0),
              ),
            ),
            child: Text(
              _appLocalizations.comm_cap_done,
              style: TextStyle(
                color: WildrColors.lightDarkTextModeColor(context),
              ),
            ),
          ),
        ),
      );

  Widget _bottomAttachableContent() => Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _mentionList(),
          _bottomKeyboardTopAttachedView(),
        ],
      );

  @override
  Widget build(BuildContext context) => BlocListener<MainBloc, MainState>(
        listener: _handleMainState,
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          body: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onVerticalDragEnd: (event) {
              _closeKeyboard();
            },
            onTap: _closeKeyboard,
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  Expanded(
                    child: Stack(
                      children: [
                        _postTextField(),
                        _doneBtn(),
                        _bottomAttachableContent(),
                      ],
                    ),
                  ),
                  SizedBox(height: 5.0.w),
                  Padding(
                    padding: EdgeInsets.only(
                      bottom: bottomPadding + Get.height * 0.02,
                    ),
                    child: _buttons(),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

  @override
  void dispose() {
    _focusNode.unfocus();
    _createTextPostGxC.clear();
    _inputController.dispose();
    _textPostBackgroundGxc.clear();
    super.dispose();
  }
}
