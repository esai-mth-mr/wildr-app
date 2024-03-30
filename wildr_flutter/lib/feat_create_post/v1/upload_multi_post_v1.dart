import 'dart:async';
import 'dart:io';

import 'package:animated_widgets/widgets/scale_animated.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_keyboard_visibility/flutter_keyboard_visibility.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:video_compress/video_compress.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/enums/comment_scope_enum.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_state.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/widgets/post_settings_list.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/utils/text_styles.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('UploadMultiPost: $message');
}

class UploadMultiMediaPostV1 extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final Challenge? defaultSelectedChallenge;

  const UploadMultiMediaPostV1(
    this.createPostGxC, {
    super.key,
    this.defaultSelectedChallenge,
  });

  @override
  UploadMultiMediaPostV1State createState() => UploadMultiMediaPostV1State();
}

class UploadMultiMediaPostV1State extends State<UploadMultiMediaPostV1> {
  List<SearchMentionResponse> _mentionedResponseList = [];
  MentionedObject? _mentionedObject;
  String? _errorMessage;
  int _loaderWeight = 0;
  late PostSettingsGxC _postSettingsGxC;
  int _refreshKey = 0;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final keyboardVisibilityController = KeyboardVisibilityController();

  CreatePostGxC get _createPostGxC => widget.createPostGxC;

  Color get _storyDependentColor =>
      _createPostGxC.isStory ? Colors.orange : WildrColors.primaryColor;
  final ScrollController _scrollController = ScrollController();
  late final MentionsInputController _richInputController =
      MentionsInputController(text: _createPostGxC.caption ?? '');
  late double bottomPadding = MediaQuery.of(context).padding.bottom;
  late final bool _isChallengePost = widget.defaultSelectedChallenge != null;

  @override
  void initState() {
    _postSettingsGxC = Get.put(
      PostSettingsGxC(),
      tag: 'uploadMultiPost',
    );
    _postSettingsGxC.initFromPrefs();
    _postSettingsGxC.selectedChallenge.value =
        widget.defaultSelectedChallenge ?? Challenge.empty();
    _postSettingsGxC.joinedChallenges
        .add(widget.defaultSelectedChallenge ?? Challenge.empty());

    super.initState();
    Common().delayIt(() => setState(() => _refreshKey++));
  }

  Widget _mentionedList() {
    if (_mentionedObject == null) return const SizedBox();
    return Container(
      // Calculates height based on item's length. If there are fewer than
      // 5 items, the Container adjusts to fit their length.
      // +8 is a padding of ListView
      height: _mentionedResponseList.length < 5
          ? mentionsItemHeight * _mentionedResponseList.length + 8
          : mentionsItemHeight * 5 + 8,
      margin: const EdgeInsets.only(top: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: Theme.of(context).colorScheme.background,
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
              _richInputController,
              _mentionedObject!,
              onInsertion: () {
                setState(
                  () {
                    _mentionedObject = null;
                    _mentionedResponseList = [];
                  },
                );
              },
              shrinkWrap: true,
            ),
          Align(
            alignment: Alignment.topRight,
            child: IconButton(
              alignment: Alignment.topRight,
              padding: EdgeInsets.zero,
              onPressed: () {
                setState(
                  () {
                    _mentionedObject = null;
                    _mentionedResponseList = [];
                  },
                );
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
  }

  void _showLoader() {
    context.loaderOverlay.show();
    setState(() {
      _loaderWeight = 1;
    });
  }

  void _hideLoader() {
    context.loaderOverlay.hide();
    setState(() {
      _loaderWeight = 0;
    });
  }

  Future<void> _upload() async {
    _showLoader();
    setState(() {
      _loaderWeight = 2;
    });
    if (_loaderWeight == 2) {
      if (_createPostGxC.isRepost) {
        final parentPostId = _createPostGxC.repost?.repostMeta?.parentPost?.id;
        if (parentPostId == null) {
          print('ParentPost id = null');
          Common().showSomethingWentWrong(context);
          context.loaderOverlay.hide();
          return;
        }
        Common().mainBloc(context).add(
              RepostEvent(
                parentPostId: parentPostId,
                captionData: _richInputController.data,
                captionBody: _richInputController.text,
                createPostGxC: _createPostGxC,
                postSettingsGxC: _postSettingsGxC,
              ),
            );
      } else {
        await createPostDataList().then((postDataList) {
          Common().mainBloc(context).add(
                CreatePostEvent(
                  processedPostData: postDataList,
                  captionData: _richInputController.data,
                  captionBody: _richInputController.text,
                  createPostGxC: _createPostGxC,
                  postSettingsGxC: _postSettingsGxC,
                ),
              );
        });
      }
    } else {
      debugPrint('WAS CANCELLED');
    }
  }

  Widget _addAnotherPostPageButton(bool shouldShowAddButton) =>
      shouldShowAddButton
          ? CreatePostCommon().addButton(
              onPressed: () {
                Navigator.of(context).pop(true);
              },
              bgColor: _storyDependentColor,
            )
          : Container(height: 1);

  Widget _optionalAddMoreButton() => _createPostGxC.isRepost
      ? const SizedBox()
      : _addAnotherPostPageButton(widget.createPostGxC.postCount <= 4);

  Widget _bottomButtons() => CreatePostCommon().bottomButtonsRow(
        _optionalAddMoreButton(),
        CreatePostCommon().bottomRightButton(
          onPressed: _upload,
          text: _createPostGxC.isRepost
              ? _appLocalizations.createPost_cap_repost
              : _appLocalizations.challenge_cap_post,
          color: _storyDependentColor,
        ),
      );

  Widget _appBarBackIcon() => const WildrIcon(WildrIcons.x_outline);

  Widget _captionField() => Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: _createPostGxC.errorIndices.contains(999)
                ? Colors.red
                : Colors.grey,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        padding: const EdgeInsets.only(left: 10, right: 10, bottom: 6),
        child: Scrollbar(
          controller: _scrollController,
          thumbVisibility: true,
          child: MentionsInput(
            scrollController: _scrollController,
            controller: _richInputController,
            keyboardAppearance: Theme.of(context).brightness,
            showCursor: true,
            maxLines: 3,
            //focusNode: _createPostGxC.focusNode,
            textInputAction: TextInputAction.done,
            maxLength: 200,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              counterStyle: const TextStyle(height: double.minPositive),
              border: InputBorder.none,
              focusedBorder: InputBorder.none,
              enabledBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              hintText: _appLocalizations.createPost_addACaption,
              hintStyle: const TextStyle(fontWeight: FontWeight.w500),
            ),
            onChanged: (text) {
              if (text.isEmpty) {
                setState(() {
                  _mentionedObject = null;
                  _mentionedResponseList = [];
                });
                return;
              }
              final result = SmartTextCommon().handleMentionedObject(
                controller: _richInputController,
                mentionedObject: _mentionedObject,
                mainBloc: Common().mainBloc(context),
                mentionedResponseList: _mentionedResponseList,
              );
              _createPostGxC.caption = text;
              _mentionedObject = result.mentionedObject;
              _mentionedResponseList = result.mentionedResponseList;
              setState(() {});
            },
          ),
        ),
      );

  void _onPostTypeTileTap() {
    if (_isChallengePost) {
      Common().showGetSnackBar(
        _appLocalizations.challenge_postRestrictionMessage,
        snackPosition: SnackPosition.TOP,
        isDisplayingError: true,
      );
      return;
    }
    Common().showGetSnackBar(
      _appLocalizations.createPost_repostAsPostNotAllowedMessage,
      snackPosition: SnackPosition.TOP,
      isDisplayingError: true,
    );
  }

  Widget _postType() {
    final Widget leading = SizedBox(
      width: 18,
      child: FaIcon(
        _createPostGxC.isStory
            ? FontAwesomeIcons.stopwatch
            : FontAwesomeIcons.infinity,
        size: 18,
        color: _storyDependentColor,
      ),
    );
    final Text title = Text(
      _appLocalizations.createPost_typeUpperCase,
      style: TextStyle(
        fontSize: 17.0.sp,
        fontWeight: FontWeight.w600,
      ),
    );
    final Text subtitle = Text(
      _createPostGxC.isStory
          ? _appLocalizations.createPost_story24Hour
          : _appLocalizations.challenge_cap_post,
      style: TextStyle(
        fontSize: 13.0.sp,
        fontWeight: FontWeight.w600,
      ),
    );
    Widget trailing = CupertinoSwitch(
      activeColor: _storyDependentColor,
      // ignore: avoid_bool_literals_in_conditional_expressions
      value: _isChallengePost || _createPostGxC.isStory,
      onChanged: (status) {
        setState(() {
          _createPostGxC.isStory = status;
          if (status) {
            _createPostGxC.commentScope = CommentScope.NONE;
          } else {
            _createPostGxC.commentScope = CommentScope.ALL;
          }
        });
      },
    );
    if ((_createPostGxC.repost?.isStory() ?? false) || _isChallengePost) {
      trailing = GestureDetector(
        onTap: _onPostTypeTileTap,
        child: AbsorbPointer(
          child: Opacity(
            opacity: 0.5,
            child: trailing,
          ),
        ),
      );
    }
    final tile = ListTile(
      contentPadding: const EdgeInsets.only(right: 8, top: 10),
      leading: leading,
      dense: true,
      minLeadingWidth: 1,
      title: title,
      subtitle: subtitle,
      trailing: trailing,
    );
    if (_isChallengePost) {
      return GestureDetector(
        onTap: _onPostTypeTileTap,
        child: Opacity(opacity: 0.5, child: tile),
      );
    }
    return tile;
  }

  List<Widget> _formFields() => [
        _postType(),
        Common().divider(),
        PostSettingsList(
          key: ValueKey(_refreshKey),
          postSettingsGxC: _postSettingsGxC,
          isStory: _createPostGxC.isStory,
          shouldShowRepostOptions: !_createPostGxC.isRepost,
          shouldShowJoinedChallenges: true,
          isFromRepost: _createPostGxC.isRepost,
        ),
      ];

  Widget _content() {
    final List<Widget> children = [
      Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Padding(
            padding: EdgeInsets.only(bottom: 30.0.h),
            child: Wrap(
              runSpacing: 5.0.w,
              children: _formFields(),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(bottom: 8.0.h),
            child: _mentionedList(),
          ),
        ],
      ),
      _captionField(),
      Row(
        children: [
          TextButton(
            child: Text(
              _appLocalizations.createPost_editDefaultPostSettings,
              style: const TextStyle(
                color: Colors.grey,
                decoration: TextDecoration.underline,
              ),
            ),
            onPressed: () {
              context.pushRoute(const PostSettingsPageRoute()).then(
                (didUpdatePrefs) {
                  if (didUpdatePrefs == true) {
                    setState(() {
                      _postSettingsGxC.initFromPrefs();
                      _refreshKey++;
                    });
                  }
                },
              );
            },
          ),
        ],
      ),
    ];
    return Padding(
      padding: EdgeInsets.only(
        top: 15.0,
        left: 15,
        right: 15,
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        // mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: children,
      ),
    );
  }

  void _onRepostTrollDetected(RepostTrollingDetectedState state) {
    Common().showTrollDetectedDialog(
      context,
      object: _appLocalizations.createPost_cap_repost,
      onYesTap: () {
        final List<double> negativeConfidenceCounts = [];
        final parentPostId = _createPostGxC.repost?.repostMeta?.parentPost?.id;
        if (parentPostId == null) {
          return;
        }
        for (final result in state.data.results) {
          negativeConfidenceCounts.add(result.confidence?.negative ?? 0);
        }
        Common().mainBloc(context).add(
              RepostEvent(
                parentPostId: parentPostId,
                captionData: _richInputController.data,
                captionBody: _richInputController.text,
                createPostGxC: _createPostGxC,
                shouldBypassTrollDetection: true,
                negativeIndices: state.data.indices,
                negativeResults: negativeConfidenceCounts,
                postSettingsGxC: _postSettingsGxC,
              ),
            );
        _showLoader();
      },
    ).then((didTapYes) {
      _createPostGxC.errorIndices.clear();
      _createPostGxC.errorIndices.addAll(state.data.indices);
      if (didTapYes == true) {
        debugPrint('VALUE = true');
        return;
      }
      debugPrint('Indices = ${state.data.indices}');
      if (state.data.indices.length == 1 && state.data.indices.contains(999)) {
        setState(() {});
        return;
      }
      setState(() {});
    });
  }

  Future<void> _onPostTrollDetected(PostTrollingDetectedState state) async {
    await Common().showTrollDetectedDialog(
      context,
      object: _appLocalizations.comm_post,
      onYesTap: () async {
        final List<double> negativeConfidenceCounts = [];
        for (final result in state.data.results) {
          negativeConfidenceCounts.add(result.confidence?.negative ?? 0);
        }
        Common().mainBloc(context).add(
              CreatePostEvent(
                processedPostData: state.postData,
                captionData: _richInputController.data,
                captionBody: _richInputController.text,
                createPostGxC: _createPostGxC,
                shouldBypassTrollDetection: true,
                indices: state.data.indices,
                negativeConfidenceCounts: negativeConfidenceCounts,
                postSettingsGxC: _postSettingsGxC,
              ),
            );
        _showLoader();
      },
    ).then((didTapYes) {
      _createPostGxC.errorIndices.clear();
      _createPostGxC.errorIndices.addAll(state.data.indices);
      if (didTapYes == true) {
        debugPrint('VALUE = true');
        return;
      }
      debugPrint('Indices = ${state.data.indices}');
      if (state.data.indices.length == 1 && state.data.indices.contains(999)) {
        setState(() {});
        return;
      }
      if (state.data.indices.isNotEmpty) {
        _showPostCards(isTrollDetected: true);
      }
      setState(() {});
    });
  }

  Future<List<PostData>> createPostDataList() async {
    final List<PostData> postDataList = _createPostGxC.posts;
    for (int i = 0; i < postDataList.length; i++) {
      final PostData postData = postDataList[i];
      if (postData is TextPostData) {
        postData.content = SmartTextCommon().createContentForSubmission(
          postData.data,
          body: postData.body,
        );
      } else if (postData is ImagePostData) {
        try {
          final List<File> data =
              await Common().generateThumbnailAndCompressImageToFiles(
            postData.croppedPath,
          );
          postData
            ..thumbFile = data[0]
            ..croppedFile = data[1];
          debugPrint('🟢 ImageFiles processed');
        } catch (error) {
          printE('ImageFiles processing failed');
          printE(error);
          postCreationFailed(kSomethingWentWrong);
          //TODO: Handle error state https://wildr.atlassian.net/browse/WILDR-5763
        }
      } else if (postData is VideoPostData) {
        final MediaInfo? compressionResponse =
            await VideoCompress.compressVideo(
          postData.originalPath,
          quality: Common()
                  .mainBloc(context)
                  .featureFlagsConfig
                  .videoCompressionRes960x540Quality
              ? VideoQuality.Res960x540Quality
              : VideoQuality.Res1280x720Quality,
        );
        if (compressionResponse != null && compressionResponse.file != null) {
          postData.compressedFile = compressionResponse.file;
          debugPrint('🟢 Compression successful');
        } else {
          //TODO: Handle error state https://wildr.atlassian.net/browse/WILDR-5763
          postCreationFailed('Can not process the video');
        }
      }
    }
    return postDataList;
  }

  void postCreationFailed(String? message) {
    Common().showSnackBar(
      context,
      message ?? _appLocalizations.createPost_submitPostAgain,
      isDisplayingError: true,
    );
    _hideLoader();
  }

  void _blocListener(BuildContext context, MainState state) {
    if (state is MentionsInputResult) {
      if (_mentionedObject == null) {
        return;
      }
      setState(() {
        _mentionedResponseList = state.response ?? [];
        _errorMessage = state.errorMessage;
      });
    } else if (state is NewPostCreatedState) {
      _hideLoader();
      _createPostGxC.shouldPop = true;
      Navigator.of(context).pop();
      Common().mainBloc(context).add(CloseCreatePostPageEvent());
    } else if (state is PostCreationFailedState) {
      Common().showSnackBar(
        context,
        state.message ?? _appLocalizations.createPost_submitPostAgain,
        isDisplayingError: true,
      );
      _hideLoader();
    } else if (state is PostTrollingDetectedState) {
      _hideLoader();
      _onPostTrollDetected(state);
    } else if (state is RepostCreatedState) {
      _hideLoader();
      _createPostGxC.shouldPop = true;
      Navigator.of(context).pop();
    } else if (state is RepostTrollingDetectedState) {
      _hideLoader();
      _onRepostTrollDetected(state);
    } else if (state is RepostCreatedFailedState) {
      _hideLoader();
      Common().showSnackBar(
        context,
        state.message ?? _appLocalizations.createPost_submitPostAgain,
        isDisplayingError: true,
      );
    } else if (state is GetJoinedChallengesState) {
      _postSettingsGxC.joinedChallenges = state.joinedChallenges ?? [];
    }
  }

  void _onBackPressed() {
    if (_createPostGxC.errorIndices.contains(999)) {
      if (_createPostGxC.trollData.isNotEmpty) {
        _createPostGxC.trollData.removeLast();
      }
      _createPostGxC.errorIndices.remove(999);
    }
    if (_loaderWeight == 0) {
      if (_createPostGxC.isRepost) {
        Navigator.pop(context);
        return;
      }
      CreatePostCommon()
          .onCreatePostPageBackPressed(context, _createPostGxC)
          .then((value) {
        if (value == POP_CURRENT_PAGE) {
          debugPrint('POPPING');
          Navigator.pop(context, POP_CURRENT_PAGE);
        }
      });
    } else if (_loaderWeight == 1) {
      _hideLoader();
    } else {
      Navigator.of(context).pop();
      Get.showSnackbar(
        GetSnackBar(
          title: _appLocalizations.createPost_note,
          messageText: Text(
            _appLocalizations.createPost_uploadInProgress,
            style: TextStyle(color: WildrColors.tabIndicatorColor(context)),
          ),
          duration: const Duration(seconds: 5),
          snackPosition: SnackPosition.TOP,
        ),
      );
    }
  }

  void _openRepostPreview() {
    context.pushRoute(PreviewRepostPageRoute(repost: _createPostGxC.repost!));
  }

  void _showPreview() {
    if (_createPostGxC.isRepost) {
      _openRepostPreview();
    } else {
      _showPostCards();
    }
  }

  // void _draftChallengePost() {
  //   ChallengePostDraft(
  //     caption: _richInputController.text,
  //     assignToChallenge: _postSettingsGxC.selectedChallenge.value?.name,
  //     postUrl: '',
  //     postVisibilityAccess:
  //     _postSettingsGxC.selectedPostVisibilityAccess.name,
  //     commentPostingAccess:
  //     _postSettingsGxC.selectedCommentPostingAccess.name,
  //     challengeId: '101',
  //   ).saveToSharedPreference();
  //   Navigator.pop(context);
  //   Common().showSnackBar(context, 'Your post is saved in draft! 🎉');
  // }

  AppBar _appBar() => AppBar(
        title: Text(
          _isChallengePost
              ? _appLocalizations.createPost_newPost
              : _createPostGxC.isRepost
                  ? _appLocalizations.createPost_cap_repost
                  : _appLocalizations.challenge_cap_post,
          textAlign: TextAlign.center,
          style: TextStyles.justTheColor,
        ),
        leading: IconButton(
          icon: _appBarBackIcon(),
          padding: EdgeInsets.zero,
          color: WildrColors.textColor(context),
          onPressed: _onBackPressed,
        ),
        actions: [
          Obx(
            () => ScaleAnimatedWidget.tween(
              animationFinished: (value) {
                if (value) {
                  Future.delayed(const Duration(milliseconds: 300)).then(
                    (value) {
                      _createPostGxC.animateCounter.value = false;
                      _createPostGxC.opacityEnabled.value = true;
                    },
                  );
                }
              },
              enabled: _createPostGxC.animateCounter.value,
              duration: const Duration(milliseconds: 100),
              scaleDisabled: 1,
              scaleEnabled: 1.8,
              child: CreatePostCommon().topRightCounter(
                _createPostGxC,
                onTap: _showPreview,
                c: WildrColors.tabIndicatorColor(context),
              ),
            ),
          ),
        ],
      );

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          _onBackPressed();
          return false;
        },
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          appBar: _appBar(),
          body: BlocListener<MainBloc, MainState>(
            bloc: Common().mainBloc(context),
            listener: _blocListener,
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onVerticalDragEnd: (_) {
                SystemChannels.textInput.invokeMethod('TextInput.hide');
              },
              child: SizedBox(
                height: Get.height - AppBar().preferredSize.height,
                child: Stack(
                  children: [
                    SizedBox(
                      height: Get.height - AppBar().preferredSize.height * 1.5,
                      child: SingleChildScrollView(child: _content()),
                    ),
                    Align(
                      alignment: Alignment.bottomCenter,
                      child: Padding(
                        padding: EdgeInsets.only(
                          bottom: Common().getBottomPadding(bottomPadding),
                        ),
                        child: _bottomButtons(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

  void _showPostCards({bool isTrollDetected = false}) {
    debugPrint('OpenBottomSheet');
    CreatePostCommon()
        .openPostsBottomSheetV1(
      context: context,
      createPostGxC: _createPostGxC,
      shouldShowNextButton: false,
      errorTitle: isTrollDetected
          ? _appLocalizations.createPost_toxicPostReviewNotification
          : null,
    )
        .then((value) {
      debugPrint('VALUE = $value and ${value == OPEN_PREVIEW_PAGE}');
      setState(() {});
      if (value == OPEN_PREVIEW_PAGE ||
          value == OPEN_PREVIEW_PAGE_WITH_NEXT_BUTTON) {
        context.pushRoute(
          PreviewMultiPostPageRoute(
            createPostGxC: _createPostGxC,
            shouldShowNextButton: false,
          ),
        );
      } else {
        if (_createPostGxC.postCount == 0) {
          Navigator.of(context).pop();
        }
      }
    });
  }

  @override
  void dispose() {
    if (_createPostGxC.isRepost) _createPostGxC.clearAll();
    super.dispose();
  }
}
