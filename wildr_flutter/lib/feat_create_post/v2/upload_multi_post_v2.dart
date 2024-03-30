import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:video_compress/video_compress.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/enums/comment_scope_enum.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_state.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/post_draft_setting.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/widgets/post_settings_list.dart';
import 'package:wildr_flutter/feat_create_post/v2/create_post_page_v2.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/draft/draft_actions_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/draft/saved_drafts_confirmation_bottom_sheet.dart';
import 'package:wildr_flutter/feat_post/post_tile/post_tile.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_gxc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/search_ext/search_state.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('UploadMultiPost: $message');
}

class UploadMultiMediaPostV2 extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final Challenge? defaultSelectedChallenge;

  const UploadMultiMediaPostV2(
    this.createPostGxC, {
    super.key,
    this.defaultSelectedChallenge,
  });

  @override
  UploadMultiMediaPostV2State createState() => UploadMultiMediaPostV2State();
}

class UploadMultiMediaPostV2State extends State<UploadMultiMediaPostV2> {
  List<SearchMentionResponse> _mentionedResponseList = [];
  MentionedObject? _mentionedObject;
  String? _errorMessage;
  int _loaderWeight = 0;
  late PostSettingsGxC _postSettingsGxC;
  int _refreshKey = 0;
  late double bottomPadding = MediaQuery.of(context).padding.bottom;
  final FocusNode _focusNode = FocusNode();

  CreatePostGxC get _createPostGxC => widget.createPostGxC;
  late final bool _isChallengePost = widget.defaultSelectedChallenge != null;

  Color get _storyDependentColor =>
      _createPostGxC.isStory ? Colors.orange : WildrColors.primaryColor;
  final ScrollController _scrollController = ScrollController();
  final ScrollController _scrollControllerNew = ScrollController();
  late final MentionsInputController _richInputController =
      MentionsInputController(text: _createPostGxC.caption ?? '');
  bool _isToastShown = false;
  late final SinglePostGxC _postGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _postSettingsGxC = Get.put(
      PostSettingsGxC(),
      tag: 'uploadMultiPost',
    );
    _postGxC = Get.put(SinglePostGxC());
    _postSettingsGxC.initFromPrefs();
    _postSettingsGxC.selectedChallenge.value =
        widget.defaultSelectedChallenge ?? Challenge.empty();
    _postSettingsGxC.joinedChallenges
        .add(widget.defaultSelectedChallenge ?? Challenge.empty());

    if (_createPostGxC.repost != null) {
      _postGxC.currentPost = _createPostGxC.repost!;
    }
    super.initState();
    Common().delayIt(() => setState(() => _refreshKey++));
  }

  void _showUploadProgressbarSnackbar() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        margin: EdgeInsets.only(
          bottom: MediaQuery.of(context).size.height - 150,
          right: 8,
          left: 8,
        ),
        backgroundColor: const Color(0xff343837).withOpacity(0.25),
        content: Common().clipIt(
          radius: 5,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onVerticalDragStart: (_) => debugPrint('no can do!'),
            child: Row(
              children: [
                const SizedBox(
                  height: 30,
                  width: 30,
                  child: Padding(
                    padding: EdgeInsets.all(5),
                    child: CircularProgressIndicator(
                      color: WildrColors.gray300,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _appLocalizations.createPost_creatingPost,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
        duration: const Duration(days: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _onUploadTapPostHandling() async {
    setState(() {
      _loaderWeight = 2;
    });
    if (_loaderWeight == 2) {
      if (_createPostGxC.isRepost) {
        final parentPostId = _createPostGxC.repost?.repostMeta?.parentPost?.id;
        if (parentPostId == null) {
          print('ParentPost id = null');
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          Common().showSomethingWentWrong();
          context.loaderOverlay.hide();
          //  context.loaderOverlay.hide();
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
        final List<double> negativeConfidenceCounts = [];
        final List<int> indices = [];
        for (int i = 0; i < _createPostGxC.postCount; i++) {
          final PostData postData = _createPostGxC.posts[i];
          if (postData is TextPostData) {
            if (postData.isTrollDetected ?? false) {
              negativeConfidenceCounts.add(postData.negative);
              indices.add(i);
            }
          }
        }

        if (indices.isNotEmpty) {
          await createPostDataList().then((postDataList) {
            Common().mainBloc(context).add(
                  CreatePostEvent(
                    processedPostData: postDataList,
                    captionData: _richInputController.data,
                    captionBody: _richInputController.text,
                    createPostGxC: _createPostGxC,
                    postSettingsGxC: _postSettingsGxC,
                    indices: indices,
                    shouldBypassTrollDetection: true,
                    negativeConfidenceCounts: negativeConfidenceCounts,
                  ),
                );
          });
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
      }
    } else {
      debugPrint('WAS CANCELLED');
    }
  }

  Future<void> _upload() async {
    if (_createPostGxC.caption != null &&
        _createPostGxC.caption!.length > 300) {
      Common().showGetSnackBar(
        _appLocalizations.createPost_characterLimitPrompt,
        snackPosition: SnackPosition.TOP,
      );
      return;
    }
    _showUploadProgressbarSnackbar();
    await _onUploadTapPostHandling();
  }

  Widget _bottomButtons() => SizedBox(
        width: double.infinity,
        child: CreatePostCommon().bottomRightButton(
          onPressed: _upload,
          text: _createPostGxC.isRepost
              ? _appLocalizations.createPost_cap_repost
              : _appLocalizations.challenge_cap_post,
          color: _storyDependentColor,
        ),
      );

  Widget _appBarBackIcon() => const WildrIcon(WildrIcons.chevron_left_outline);

  Widget _captionField() {
    if (MediaQuery.of(context).viewInsets.bottom > 0) {
      return const SizedBox();
    }
    return InkWell(
      onTap: () {
        SystemChannels.textInput.invokeMethod('TextInput.show');
        _focusNode.requestFocus();
      },
      child: Container(
        padding: const EdgeInsets.only(right: 10, bottom: 6, top: 6),
        child: Scrollbar(
          controller: _scrollController,
          thumbVisibility: true,
          child: MentionsInput(
            onTap: () {
              if (Platform.isIOS) {
                SystemChannels.textInput.invokeMethod('TextInput.show');
                _focusNode.requestFocus();
              }
            },
            enabled: Platform.isIOS,
            scrollController: _scrollController,
            controller: _richInputController,
            keyboardAppearance: Theme.of(context).brightness,
            showCursor: true,
            maxLines: 10,
            minLines: 4,
            //focusNode: _createPostGxC.focusNode,
            textInputAction: TextInputAction.done,
            maxLength: 300,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              contentPadding: EdgeInsets.zero,
              counterStyle: const TextStyle(height: double.minPositive),
              border: InputBorder.none,
              focusedBorder: InputBorder.none,
              enabledBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              hintText: _appLocalizations.createPost_mindSharingPrompt,
              hintStyle: TextStyle(
                fontWeight: FontWeight.w600,
                color: WildrColors.appBarTextColor(),
              ),
            ),
            onChanged: (text) {},
          ),
        ),
      ),
    );
  }

  Widget _captionFieldView() => Container(
        height: 200.0.h,
        padding: const EdgeInsets.only(right: 10, bottom: 30),
        color: WildrColors.createPostBGColor(),
        child: Scrollbar(
          controller: _scrollControllerNew,
          thumbVisibility: true,
          child: MentionsInput(
            focusNode: _focusNode,
            autofocus: true,
            scrollController: _scrollControllerNew,
            controller: _richInputController,
            keyboardAppearance: Theme.of(context).brightness,
            showCursor: true,
            maxLines: 8,
            //focusNode: _createPostGxC.focusNode,
            textInputAction: TextInputAction.done,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              counterStyle: TextStyle(height: double.minPositive),
              border: InputBorder.none,
              focusedBorder: InputBorder.none,
              enabledBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              hintStyle: TextStyle(fontWeight: FontWeight.w500),
            ),
            onChanged: (text) {
              if (text.isEmpty) {
                setState(() {
                  _mentionedObject = null;
                });
                return;
              }
              _mentionedObject =
                  SmartTextCommon().performTagsAndMentionedDetectionAndSearch(
                _richInputController,
                _mentionedObject,
                Common().mainBloc(context),
              );
              _createPostGxC.caption = text;
              if (!_isToastShown && text.length > 300) {
                _isToastShown = true;
                Common().showGetSnackBar(
                  _appLocalizations.createPost_characterLimitPrompt,
                  snackPosition: SnackPosition.TOP,
                );
              } else if (text.length < 300) {
                _isToastShown = false;
              }
              setState(() {});
            },
          ),
        ),
      );

  Widget _getKeyboardOpenCaptionEditText() => Column(
        children: [
          Stack(
            children: [
              _captionFieldView(),
              _bottomViewHashtagsAndMentionsOverlay(leftPosition: 18),
              _bottomViewMaxLengthOverLay(),
            ],
          ),
          if (_mentionedObject != null &&
              MediaQuery.of(context).viewInsets.bottom > 0 &&
              _mentionedObject!.type == ESSearchType.HASHTAGS) ...[
            Expanded(child: _hashTagList()),
          ],
          if (_mentionedObject != null &&
              MediaQuery.of(context).viewInsets.bottom > 0 &&
              _mentionedObject!.type == ESSearchType.USER) ...[
            Expanded(
              child: ColoredBox(
                color: WildrColors.createPostBGColor().withOpacity(0.85),
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: max(
                        MediaQuery.of(context).viewInsets.bottom -
                            bottomPadding,
                        0,
                      ),
                    ),
                    child: _searchList(),
                  ),
                ),
              ),
            ),
          ],
        ],
      );

  Widget _postType() {
    final Text subtitle = Text(
      _appLocalizations.createPost_storyVisible24Hr,
      style: TextStyle(
        fontSize: 14.0.sp,
        fontWeight: FontWeight.w600,
        color: widget.defaultSelectedChallenge?.id != null
            ? WildrColors.gray600
            : WildrColors.appBarTextColor(),
      ),
    );
    Widget trailing = Transform.scale(
      scale: 0.95,
      child: CupertinoSwitch(
        activeColor: _storyDependentColor,
        value: _createPostGxC.isStory,
        onChanged: (status) {
          setState(() {
            _createPostGxC.isStory = status;
            debugPrint('Status = $status');
            if (status) {
              _createPostGxC.commentScope = CommentScope.NONE;
            } else {
              _createPostGxC.commentScope = CommentScope.ALL;
            }
          });
        },
      ),
    );
    if (_createPostGxC.repost?.isStory() ?? false) {
      trailing = GestureDetector(
        onTap: () {
          Common().showSnackBar(
            context,
            _appLocalizations.createPost_repostAsPostNotAllowedMessage,
          );
        },
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
      dense: true,
      minLeadingWidth: 1,
      title: subtitle,
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
      _appLocalizations.createPost_cannotRepostAsPostMessage,
      snackPosition: SnackPosition.TOP,
      isDisplayingError: true,
    );
  }

  List<Widget> _formFields() => [
        if (_createPostGxC.repost != null)
          Column(
            children: [
              Container(
                width: Get.width,
                decoration: BoxDecoration(
                  color: WildrColors.createPostBGColor(),
                ),
                child: Column(
                  children: [
                    Text(
                      'Original post from '
                      '${_postGxC.currentPost.author.handle}',
                    ),
                    SmartTextCommon().getAutoResizeText(
                      segmentsOrCaption: _postGxC.currentPost.caption,
                      fontSize: 12,
                    ),
                  ],
                ),
              ),
              const SizedBox(
                height: 8,
              ),
              const Divider(),
              const SizedBox(
                height: 4,
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: SizedBox(
                  height: Get.height * 0.2,
                  width: Get.width / 4,
                  child: Common().clipIt(
                    radius: 4,
                    child: PostTile(_postGxC.currentPost),
                  ),
                ),
              ),
            ],
          )
        else
          _PostList(createPostGxC: _createPostGxC),
        const SizedBox(
          height: 8,
        ),
        const Divider(),
        Stack(
          children: [
            Column(
              children: [
                _captionField(),
                const SizedBox(height: 16), // Add desired vertical space here
              ],
            ),
            _bottomViewHashtagsAndMentionsOverlay(leftPosition: 0),
          ],
        ),
        const Divider(),
        _postType(),
        PostSettingsList(
          key: ValueKey(_refreshKey),
          postSettingsGxC: _postSettingsGxC,
          isStory: _createPostGxC.isStory,
          shouldShowRepostOptions: !_createPostGxC.isRepost,
          shouldShowJoinedChallenges: true,
          isFromRepost: _createPostGxC.isRepost,
        ),
      ];

  Widget _bottomViewHashtagsAndMentionsOverlay({
    required double leftPosition,
  }) =>
      Positioned(
        bottom: 12,
        left: leftPosition,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 8),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.all(Radius.circular(5)),
                border: Border.all(color: WildrColors.gray900),
              ),
              child: Text(
                _appLocalizations.createPost_hashtags,
                style: TextStyle(color: WildrColors.createPostV2LabelsColor()),
              ),
            ),
            const SizedBox(
              width: 10,
            ),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 8),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.all(Radius.circular(5)),
                border: Border.all(color: WildrColors.gray900),
              ),
              child: Text(
                _appLocalizations.createPost_mention,
                style: TextStyle(color: WildrColors.createPostV2LabelsColor()),
              ),
            ),
          ],
        ),
      );

  Widget _bottomViewMaxLengthOverLay() => Positioned(
        bottom: 20,
        right: 20,
        child: RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '${_richInputController.text.length}',
                style: TextStyle(
                  color: (_richInputController.text.length > 300)
                      ? Colors.red
                      : (WildrColors.isLightMode(context)
                          ? Colors.grey[500]
                          : Colors.white54),
                ),
              ),
              TextSpan(
                text: ' /300',
                style: TextStyle(
                  color: WildrColors.isLightMode(context)
                      ? Colors.grey[500]
                      : Colors.white54,
                ),
              ),
            ],
          ),
        ),
      );

  double get _searchListHeight => Get.height * 0.11;

  Widget _searchList() => Padding(
        padding: const EdgeInsets.only(left: 2, right: 4),
        child: SizedBox(
          height: _searchListHeight,
          child: _mentionedResponseList.isEmpty
              ? Center(
                  child: _errorMessage == null
                      ? const CupertinoActivityIndicator()
                      : Text(_errorMessage!),
                )
              : SmartTextCommon().mentionsList(
                  _mentionedResponseList,
                  shouldShowRing: false,
                  _richInputController,
                  _mentionedObject!,
                  handleColor: WildrColors.appBarTextColor(context),
                  onInsertion: () {
                    _mentionedObject = null;
                    setState(() {});
                  },
                ),
        ),
      );

  Widget _hashTagList() => Padding(
        padding: const EdgeInsets.only(left: 2, right: 4, bottom: 8),
        child: _mentionedResponseList.isEmpty
            ? Center(
                child: _errorMessage == null
                    ? const CupertinoActivityIndicator()
                    : Text(_errorMessage!),
              )
            : SmartTextCommon().hashtagList(
                _mentionedResponseList,
                _richInputController,
                _mentionedObject!,
                onInsertion: () {
                  _mentionedObject = null;
                  setState(() {});
                },
              ),
      );

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xff343837).withOpacity(0.25),
            margin: EdgeInsets.only(
              bottom: MediaQuery.of(context).size.height - 150,
            ),
            content: Common().clipIt(
              radius: 5,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onVerticalDragStart: (_) => debugPrint('no can do!'),
                child: Row(
                  children: [
                    const CircularProgressIndicator(
                      color: WildrColors.gray300,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _appLocalizations.createPost_creatingPost,
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            duration: const Duration(days: 1),
            behavior: SnackBarBehavior.floating,
          ),
        );
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

  void _onPostTrollDetected(PostTrollingDetectedState state) {
    Common().showTrollDetectedDialog(
      context,
      object: 'Post',
      onYesTap: () {
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xff343837).withOpacity(0.25),
            margin: EdgeInsets.only(
              bottom: MediaQuery.of(context).size.height - 150,
            ),
            content: Common().clipIt(
              radius: 5,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onVerticalDragStart: (_) => debugPrint('no can do!'),
                child: Row(
                  children: [
                    const CircularProgressIndicator(
                      color: WildrColors.gray300,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _appLocalizations.createPost_creatingPost,
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            duration: const Duration(days: 1),
            behavior: SnackBarBehavior.floating,
          ),
        );
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
        }
      } else if (postData is StorageMediaPostData) {
        if (postData.assetEntity?.type == photo_manager.AssetType.image) {
          try {
            final List<File> data =
                await Common().generateThumbnailAndCompressImageToFiles(
              postData.assetPath,
            );
            postData
              ..thumbFile = data[0]
              ..compressedFile = data[1];
            debugPrint('🟢 ImageFiles processed');
          } catch (error) {
            printE('ImageFiles processing failed');
            printE(error);
            postCreationFailed(kSomethingWentWrong);
          }
        } else {
          // iOS doesn't need compression as it is already compressed by
          // default. But, if recorded from camera, we need to compress it.
          const bool isFromCamera = false;
          if (Platform.isIOS && !isFromCamera) {
            // Just copy the "original" file to the compressed
            postData.compressedFile = File(postData.assetPath);
          } else {
            debugPrint('🟡 Compression started');
            final MediaInfo? compressionResponse =
                await VideoCompress.compressVideo(
              postData.assetPath,
              quality: Common()
                      .mainBloc(context)
                      .featureFlagsConfig
                      .videoCompressionRes960x540Quality
                  ? VideoQuality.Res960x540Quality
                  : VideoQuality.Res1280x720Quality,
            );
            if (compressionResponse != null &&
                compressionResponse.file != null) {
              postData.compressedFile = compressionResponse.file;
              debugPrint('🟢 Compression successful');
            } else {
              printE('VideoCompression failed');
              postCreationFailed(
                'Can not process the video',
              );
            }
          }
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
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
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
      // _hideLoader();
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      _createPostGxC.shouldPop = true;
      Navigator.of(context).pop();
      Common().mainBloc(context).add(CloseCreatePostPageEvent());
    } else if (state is PostCreationFailedState) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      Common().showSnackBar(
        context,
        state.message ?? _appLocalizations.createPost_postCreationErrorMessage,
        isDisplayingError: true,
      );
      // _hideLoader();
    } else if (state is PostTrollingDetectedState) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      //   _hideLoader();
      _onPostTrollDetected(state);
    } else if (state is RepostCreatedState) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      //_hideLoader();
      _createPostGxC.shouldPop = true;
      Navigator.of(context).pop();
    } else if (state is RepostTrollingDetectedState) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      // _hideLoader();
      _onRepostTrollDetected(state);
    } else if (state is RepostCreatedFailedState) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      // _hideLoader();
      Common().showSnackBar(
        context,
        state.message ?? _appLocalizations.createPost_postCreationErrorMessage,
        isDisplayingError: true,
      );
    } else if (state is GetJoinedChallengesState) {
      _postSettingsGxC.joinedChallenges = state.joinedChallenges ?? [];
    }
  }

  void _onBackPressed() {
    if (_createPostGxC.isRepost) {
      Navigator.pop(context);
      return;
    }
    Navigator.of(context).pop();
  }

  Future<void> _draftChallengePost() async {
    final List<Map<String, dynamic>> jsonDataList = _createPostGxC.posts
        .map(
          (postData) => {
            'type': postData.runtimeType.toString(),
            'data': postData.toJson(),
          },
        )
        .toList();

    PostSettingsDraft(
      postVisibilityAccess: _postSettingsGxC.selectedPostVisibilityAccess.name,
      commentVisibilityAccess:
          _postSettingsGxC.selectedCommentVisibilityAccess.name,
      commentPostingAccess: _postSettingsGxC.selectedCommentPostingAccess.name,
      postsData: jsonEncode(jsonDataList),
      challengeId: widget.defaultSelectedChallenge?.id ?? '',
      draftType: widget.defaultSelectedChallenge?.id != null
          ? PostDraftType.CHALLENGE
          : PostDraftType.DEFAULT,
    ).saveToSharedPreference();
    await showModalBottomSheet(
      barrierColor: WildrColors.black.withOpacity(0.6),
      isScrollControlled: true,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => SavedDraftsConfirmationBottomSheet(
        onDoneTap: () {
          _createPostGxC.clearAll();
          final Map<String, dynamic> navBackMap = {};
          navBackMap['type'] = 'camera';
          Navigator.pop(context, navBackMap);
        },
        onGoDraftTap: () {
          _createPostGxC.clearAll();
          final Map<String, dynamic> navBackMap = {};
          navBackMap['type'] = 'draft';
          Navigator.pop(context, navBackMap);
        },
      ),
    );
  }

  AppBar _appBar() => AppBar(
        backgroundColor: WildrColors.createPostBGColor(context),
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: _appBarBackIcon(),
          padding: EdgeInsets.zero,
          color: WildrColors.textColor(),
          onPressed: _onBackPressed,
        ),
        actions: [
          if (!_createPostGxC.isRepost)
            Center(
              child: Padding(
                padding: EdgeInsets.only(right: 16.0.w),
                child: InkWell(
                  onTap: () async => await showModalBottomSheet(
                    barrierColor: WildrColors.black.withOpacity(0.6),
                    isScrollControlled: true,
                    context: context,
                    backgroundColor: Colors.transparent,
                    builder: (context) => DraftActionsBottomSheet(
                      saveDraftTap: () {
                        _draftChallengePost();
                      },
                    ),
                  ),
                  child: Text(
                    _appLocalizations.createPost_saveAsDraft,
                    style: TextStyle(
                      color: WildrColors.createPostV2LabelsColor(),
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                    ),
                  ),
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
        child: ChallengesTheme(
          child: Scaffold(
            backgroundColor: WildrColors.createPostBGColor(context),
            resizeToAvoidBottomInset: false,
            appBar: _appBar(),
            body: BlocListener<MainBloc, MainState>(
              bloc: Common().mainBloc(context),
              listener: _blocListener,
              child: SafeArea(
                child: Stack(
                  children: [
                    AbsorbPointer(
                      absorbing: MediaQuery.of(context).viewInsets.bottom > 0,
                      child: Column(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              behavior: HitTestBehavior.translucent,
                              onVerticalDragEnd: (_) {
                                SystemChannels.textInput
                                    .invokeMethod('TextInput.hide');
                              },
                              child: SingleChildScrollView(
                                child: Padding(
                                  padding: EdgeInsets.only(
                                    top: 15,
                                    left: 15,
                                    right: 15,
                                    bottom: MediaQuery.of(context)
                                        .viewInsets
                                        .bottom,
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: _formFields(),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(
                              left: 15,
                              right: 15,
                              bottom: 15,
                            ),
                            child: _bottomButtons(),
                          ),
                        ],
                      ),
                    ),
                    if (MediaQuery.of(context).viewInsets.bottom > 0) ...[
                      _getKeyboardOpenCaptionEditText(),
                    ],
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
        .openPostsBottomSheet(
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

class _PostList extends StatefulWidget {
  final CreatePostGxC createPostGxC;

  const _PostList({
    required this.createPostGxC,
  });

  @override
  _PostListState createState() => _PostListState();
}

class _PostListState extends State<_PostList> {
  final double itemWidth = Get.width * 0.25;
  final double itemHeight = Get.height * 0.18;
  final int maxPosts = 5;

  Widget _textPostPreview(List<Segment> segments) => DecoratedBox(
        decoration: BoxDecoration(
          color: WildrColors.textPostBGColor(context),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Center(
          child: SmartTextCommon().getAutoResizeTextPreview(
            segmentsOrCaption: segments,
            context: context,
            min: 2,
            max: 10,
          ),
        ),
      );

  Widget _imagePostPreview(File imageFile) => Common().clipIt(
        radius: 4,
        child: Image.file(
          imageFile,
          fit: BoxFit.cover,
        ),
      );

  Widget _storageMediaPreview(photo_manager.AssetEntity assetEntity) => Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: Colors.black,
              ),
              child: Common().clipIt(
                radius: 4,
                child: photo_manager.AssetEntityImage(
                  assetEntity,
                  isOriginal: false,
                  thumbnailSize: const photo_manager.ThumbnailSize.square(250),
                  fit: assetEntity.width > assetEntity.height
                      ? (assetEntity.type == photo_manager.AssetType.video)
                          ? BoxFit.cover
                          : BoxFit.contain
                      : BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) =>
                      CreatePostCommon().unableToLoadImageText(),
                ),
              ),
            ),
          ),
          if (assetEntity.type == photo_manager.AssetType.video) ...[
            Positioned.fill(
              child: Align(
                alignment: Alignment.bottomRight,
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Text(
                    CreatePostCommon().formatDurationToMinuteAndSecond(
                      assetEntity.videoDuration,
                    ),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),
            _videoThumbnailIcon(),
          ],
        ],
      );

  Widget _videoPostPreview(VideoPostData postData) => Common().clipIt(
        radius: 4,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.file(
              File(postData.thumbFile?.path ?? ''),
              fit: BoxFit.fill,
            ),
            _videoThumbnailIcon(),
          ],
        ),
      );

  Widget _videoThumbnailIcon() => Align(
        child: WildrIcon(
          WildrIcons.videoThumbnailIcon,
          color: WildrColors.gray100,
          size: (Get.width / 3) / 4,
        ),
      );

  Widget _postPreview(PostData postData) {
    if (postData is TextPostData) {
      return _textPostPreview(postData.segments ?? []);
    } else if (postData is ImagePostData) {
      return _imagePostPreview(postData.croppedFile!);
    } else if (postData is StorageMediaPostData) {
      return _storageMediaPreview(postData.assetEntity!);
    } else if (postData is VideoPostData) {
      return _videoPostPreview(postData);
    } else {
      return Text(AppLocalizations.of(context)!.createPost_unsupportedMedia);
    }
  }

  void _handleAddPost() {
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: itemHeight,
        child: GetBuilder<CreatePostGxC>(
          init: widget.createPostGxC,
          builder: (controller) => ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: controller.posts.length +
                (controller.posts.length < maxPosts ? 1 : 0),
            itemBuilder: (context, index) {
              if (index < controller.posts.length) {
                return GestureDetector(
                  onTap: () {
                    context
                        .pushRoute(
                      PostPreviewPageRoute(
                        height: widget.createPostGxC.height,
                        postData: controller.posts[index],
                        onDelete: () {
                          widget.createPostGxC.posts.removeAt(index);
                          widget.createPostGxC.postCount -= 1;
                          widget.createPostGxC.update();
                          context.popRoute();
                        },
                        createPostGxC: widget.createPostGxC,
                        index: index,
                      ),
                    )
                        .then((value) {
                      if (widget.createPostGxC.posts.isEmpty) {
                        context.popRoute();
                      }
                    });
                  },
                  child: Container(
                    width: itemWidth,
                    height: itemHeight,
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: _postPreview(controller.posts[index]),
                  ),
                );
              } else if (controller.posts.length < maxPosts) {
                return AddPost(
                  onTap: _handleAddPost,
                  width: itemWidth,
                  height: itemHeight,
                  isUpload: true,
                );
              } else {
                return AddPost(
                  onTap: _handleAddPost,
                  width: itemWidth,
                  height: itemHeight,
                  isUpload: true,
                );
              }
            },
          ),
        ),
      );
}
