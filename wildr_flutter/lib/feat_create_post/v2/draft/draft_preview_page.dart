import 'dart:convert';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/post_draft_setting.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/gxc/draft_manager_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/draft/delete_draft_post_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/draft/draft_actions_bottom_sheet.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/wildr_video_player.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DraftPreviewPage extends StatefulWidget {
  final CreatePostGxC createPostGxC;
  final PostSettingsDraft draft;
  final Challenge? defaultSelectedChallenge;

  const DraftPreviewPage({
    super.key,
    required this.createPostGxC,
    required this.draft,
    required this.defaultSelectedChallenge,
  });

  @override
  State<DraftPreviewPage> createState() => _DraftPreviewPageState();
}

class _DraftPreviewPageState extends State<DraftPreviewPage> {
  late PostData postData;
  int selectedIndex = 0;
  late final MainBloc _mainBloc = Common().mainBloc(context);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  final DraftManagerGxC draftGxC = Get.find();

  @override
  void initState() {
    // TODO: implement initState
    if (widget.createPostGxC.posts.isNotEmpty) {
      postData = widget.createPostGxC.posts[0];
    }
    super.initState();
  }

  Future<void> _onSaveDraftTap() async {
    final List<dynamic> draftPostData = jsonDecode(widget.draft.postsData!);
    if (draftPostData.length < widget.createPostGxC.posts.length) {
      final List<Map<String, dynamic>> jsonDataList = widget.createPostGxC.posts
          .map(
            (postData) => {
              'type': postData.runtimeType.toString(),
              'data': postData.toJson(),
            },
          )
          .toList();

      PostSettingsDraft(
        postVisibilityAccess: widget.draft.postVisibilityAccess,
        commentVisibilityAccess: widget.draft.commentVisibilityAccess,
        commentPostingAccess: widget.draft.commentPostingAccess,
        postsData: jsonEncode(jsonDataList),
        challengeId: widget.draft.challengeId,
        draftType: widget.draft.draftType,
      ).saveToSharedPreference();

      await draftGxC.deleteDraft(widget.draft);
      widget.createPostGxC.clearAll();
      _mainBloc.add(DraftUpdatedEvent());
      Navigator.pop(context);
    } else {
      widget.createPostGxC.clearAll();
      Navigator.pop(context);
    }
  }

  Widget _addMoreContentBtn() => SizedBox(
        width: 200.0.w,
        child: ElevatedButton(
          onPressed: () async {
            await draftGxC.deleteDraft(widget.draft);
            context.loaderOverlay.show();
            _mainBloc.add(GoToCameraEvent());
            context.loaderOverlay.hide();
            Navigator.pop(context);
            Common().showSnackBar(
              context,
              _appLocalizations.createPost_postMovedOutOfDrafts,
              icon: const WildrIcon(
                WildrIcons.rightIcon,
                color: Colors.white,
                size: 24,
              ),
              showIcon: true,
            );
          },
          style: ElevatedButton.styleFrom(
            foregroundColor: WildrColors.appBarTextColor(),
            backgroundColor: WildrColors.addPostColor(),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(
                15.0,
              ),
            ),
          ),
          child: Text(
            _appLocalizations.createPost_addMoreContent,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  Widget _textPostPreview(List<Segment> segments, bool isThumbnail) {
    if (!isThumbnail) {
      return DecoratedBox(
        decoration: BoxDecoration(
          color: WildrColors.textPostBGColor(context),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: SmartTextCommon().getAutoResizeText(
            segmentsOrCaption: segments,
            context: context,
          ),
        ),
      );
    }
    return Container(
      width: 32.0.w,
      height: 45.0.h,
      decoration: BoxDecoration(
        color: WildrColors.textPostBGColor(context),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: SmartTextCommon().getAutoResizeTextPreview(
          segmentsOrCaption: segments,
          context: context,
        ),
      ),
    );
  }

  Widget _imagePostPreview(File imageFile) => Image.file(
        imageFile,
        fit: BoxFit.fitHeight,
      );

  Widget _storageMediaPreview(
    photo_manager.AssetEntity assetEntity,
    bool isThumbnail,
  ) {
    if (assetEntity.type == photo_manager.AssetType.video && !isThumbnail) {
      return WildrVideoPlayer(entity: assetEntity);
    }
    return SizedBox(
      width: isThumbnail ? 32 : null,
      height: isThumbnail ? 45 : null,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: Common().clipIt(
              radius: 10,
              child: photo_manager.AssetEntityImage(
                assetEntity,
                isOriginal: !isThumbnail,
                width: isThumbnail ? 32 : null,
                height: isThumbnail ? 45 : null,
                thumbnailSize: const photo_manager.ThumbnailSize.square(
                  THUMBNAIL_SIZE_VALUE,
                ),
                fit: BoxFit.fill,
                errorBuilder: (context, error, stackTrace) =>
                    CreatePostCommon().unableToLoadImageText(),
              ),
            ),
          ),
          if (assetEntity.type == photo_manager.AssetType.video)
            _videoThumbnailIcon(),
        ],
      ),
    );
  }

  Widget _postPreview(PostData postData, bool isThumbnail) {
    if (postData is TextPostData) {
      return _textPostPreview(postData.segments ?? [], isThumbnail);
    } else if (postData is ImagePostData) {
      return Common().clipIt(
        radius: 10,
        child: _imagePostPreview(postData.croppedFile!),
      );
    } else if (postData is StorageMediaPostData) {
      return Common().clipIt(
        radius: 10,
        child: _storageMediaPreview(postData.assetEntity!, isThumbnail),
      );
    } else if (postData is VideoPostData) {
      if (!isThumbnail) {
        return Common().clipIt(
          radius: 10,
          child: WildrVideoPlayer(file: File(postData.originalPath)),
        );
      } else {
        return Common().clipIt(
          radius: 10,
          child: SizedBox(
            width: 32,
            height: 45,
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
          ),
        );
      }
    }
    return Container();
  }

  Widget _videoThumbnailIcon() => Align(
        child: WildrIcon(
          WildrIcons.videoThumbnailIcon,
          color: WildrColors.gray100,
          size: (Get.width / 3) / 10,
        ),
      );

  void _showDraftMovedOutSnackBar() {
    Common().showSnackBar(
      context,
      _appLocalizations.createPost_postMovedOutOfDrafts,
      showIcon: true,
      icon: const WildrIcon(
        WildrIcons.rightIcon,
        color: Colors.white,
        size: 24,
      ),
    );
  }

  List<Widget> _appBarActions() => [
        Center(
          child: Padding(
            padding: EdgeInsets.only(right: 8.0.w),
            child: InkWell(
              onTap: () async {
                context.loaderOverlay.show();
                await draftGxC.deleteDraft(widget.draft);
                _showDraftMovedOutSnackBar();
                context.loaderOverlay.hide();
                await context
                    .pushRoute(
                  UploadMultiMediaPostV2Route(
                    createPostGxC: widget.createPostGxC,
                    defaultSelectedChallenge: widget.defaultSelectedChallenge,
                  ),
                )
                    .then((value) {
                  Common().mainBloc(context).add(DraftUpdatedEvent());
                  Navigator.pop(context);
                });
              },
              child: GetBuilder<CreatePostGxC>(
                init: widget.createPostGxC,
                builder: (controller) => Text(
                  _appLocalizations.comm_cap_next,
                  style: TextStyle(
                    color: controller.posts.isEmpty
                        ? WildrColors.emerald1400
                        : WildrColors.primaryColor,
                  ),
                ),
              ),
            ),
          ),
        ),
      ];

  Widget _draftPostsList() => SizedBox(
        height: 60,
        child: GetBuilder<CreatePostGxC>(
          init: widget.createPostGxC,
          builder: (controller) => ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: controller.posts.length,
            itemBuilder: (context, index) => GestureDetector(
              onTap: () {
                setState(() {
                  selectedIndex = index;
                  postData = controller.posts[index];
                });
              },
              child: Center(
                child: Container(
                  margin: const EdgeInsets.only(
                    right: 6,
                    top: 4,
                    bottom: 4,
                    left: 6,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selectedIndex == index
                          ? WildrColors.appBarTextColor()
                          : Colors.transparent,
                    ),
                  ),
                  child: _postPreview(controller.posts[index], true),
                ),
              ),
            ),
          ),
        ),
      );

  Widget _leading() => IconButton(
        icon: WildrIcon(
          WildrIcons.chevron_left_outline,
          color: WildrColors.appBarTextColor(),
        ),
        onPressed: _onBackIconTap,
      );

  Future<void> _onBackIconTap() async => await showModalBottomSheet(
        barrierColor: WildrColors.black.withOpacity(0.6),
        isScrollControlled: true,
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) => DraftActionsBottomSheet(
          isDraftPreview: true,
          deleteTap: _onDeleteTap,
          saveDraftTap: _onSaveDraftTap,
        ),
      );

  Future<void> _onDeleteTap() async {
    context.loaderOverlay.show();
    await draftGxC.deleteDraft(widget.draft);
    widget.createPostGxC.clearAll();
    _mainBloc.add(DraftUpdatedEvent());
    context.loaderOverlay.hide();
    Navigator.pop(context);
  }

  AppBar _appBar() => AppBar(
        titleSpacing: Get.width * 0.1,
        centerTitle: true,
        leadingWidth: 40,
        leading: _leading(),
        title: _draftPostsList(),
        actions: _appBarActions(),
      );

  Widget _deleteBtn() => DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: WildrColors.addPostColor(),
        ),
        child: IconButton(
          icon: const WildrIcon(
            WildrIcons.deleteIcon,
            size: 20,
          ),
          onPressed: () async {
            await _showDeleteBottomSheet();
          },
        ),
      );

  Future _showDeleteBottomSheet() async {
    await showModalBottomSheet(
      barrierColor: WildrColors.black.withOpacity(0.6),
      isScrollControlled: true,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => DeleteDraftPostBottomSheet(
        title: CreatePostCommon()
            .getDeletePostTitleFromPostData(postData, context),
        onDeleteTap: () async {
          context.loaderOverlay.show();
          if (widget.createPostGxC.posts.length == 1) {
            await draftGxC.deleteDraft(widget.draft);
            widget.createPostGxC.clearAll();
            _mainBloc.add(DraftUpdatedEvent());
            context.loaderOverlay.hide();
            Navigator.pop(context);
          } else {
            widget.createPostGxC.posts.removeAt(selectedIndex);
            widget.createPostGxC.postCount -= 1;
            widget.createPostGxC.update();
            setState(() {
              if (widget.createPostGxC.posts.isNotEmpty) {
                postData = widget.createPostGxC.posts[0];
              }
            });
            context.loaderOverlay.hide();
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async {
          await _onBackIconTap();
          return false;
        },
        child: ChallengesTheme(
          child: Scaffold(
            backgroundColor: WildrColors.createPostBGColor(),
            appBar: _appBar(),
            body: Column(
              children: [
                const SizedBox(height: 6),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: _postPreview(postData, false),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _deleteBtn(),
                      _addMoreContentBtn(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
