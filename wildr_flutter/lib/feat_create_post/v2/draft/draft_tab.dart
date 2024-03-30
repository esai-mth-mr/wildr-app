import 'dart:convert';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/post_draft_setting.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/gxc/draft_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/draft/gxc/draft_manager_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/draft/delete_draft_post_bottom_sheet.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DraftTab extends StatefulWidget {
  final Challenge? defaultSelectedChallenge;

  const DraftTab({
    super.key,
    this.defaultSelectedChallenge,
  });

  @override
  State<DraftTab> createState() => _DraftTabState();
}

class _DraftTabState extends State<DraftTab> {
  late List<PostSettingsDraft> draftsList;
  final DraftGxC _draftGxC = Get.put(DraftGxC());
  final DraftManagerGxC draftGxC = Get.find();

  void onItemSelect(int index) {
    final bool indexExists = _draftGxC.selectedIndices.contains(index);
    if (indexExists) {
      _draftGxC.selectedIndices.remove(index);
      _draftGxC.update();
    } else {
      _draftGxC.selectedIndices.add(index);
      _draftGxC.update();
    }
  }

  Widget _noDraftFound() => Center(
        child: Text(
          AppLocalizations.of(context)!.createPost_postDraftsWillBeSavedHere,
          style: const TextStyle(color: WildrColors.gray700),
        ),
      );

  Widget _draftGrid(List<PostSettingsDraft> drafts) => GetBuilder<DraftGxC>(
        builder: (controller) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12.0,
              mainAxisSpacing: 12.0,
              childAspectRatio: .6,
            ),
            itemCount: drafts.length,
            itemBuilder: (context, index) {
              final PostSettingsDraft draft = drafts[index];
              return _DraftItem(
                index: index,
                selectedDrafts: controller.selectedIndices,
                draft: draft,
                defaultSelectedChallenge: widget.defaultSelectedChallenge,
                isEditing: controller.isEditing,
                onItemTap: () {
                  onItemSelect(index);
                },
              );
            },
          ),
        ),
      );

  Future<void> _showDeleteDraftBottomSheet(DraftGxC controller) async {
    await showModalBottomSheet(
      barrierColor: WildrColors.black.withOpacity(0.6),
      isScrollControlled: true,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => DeleteDraftPostBottomSheet(
        title: AppLocalizations.of(context)!.createPost_deleteSelectedDrafts,
        onDeleteTap: () async {
          context.loaderOverlay.show();
          final List<PostSettingsDraft> selectedDraftsList = [];
          for (final int index in _draftGxC.selectedIndices) {
            if (index >= 0 && index < draftsList.length) {
              selectedDraftsList.add(draftsList[index]);
            }
          }
          await draftGxC.deleteDrafts(selectedDraftsList);
          controller..clearAll()
          ..update();
          Common().mainBloc(context).add(DraftUpdatedEvent());
          context.loaderOverlay.hide();
          setState(() {});
        },
      ),
    );
  }

  Widget _deleteBtn(DraftGxC controller) => Padding(
        padding: const EdgeInsets.all(8.0),
        child: ElevatedButton(
          onPressed: () async {
            await _showDeleteDraftBottomSheet(controller);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: WildrColors.addPostColor(),
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 12.0,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.0),
            ),
          ),
          child: Text(
            'Delete (${controller.selectedIndices.length})',
            style: const TextStyle(fontSize: 18.0, color: WildrColors.red),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: WildrColors.createPostBGColor(),
        body: BlocListener<MainBloc, MainState>(
          listener: (context, state) {
            if (state is DraftUpdatedState) {
              setState(() {});
            }
          },
          child: GetBuilder<DraftManagerGxC>(
            builder: (draftController) {
              if (draftController.drafts.isEmpty) {
                return _noDraftFound();
              } else {
                draftsList = draftController.drafts;
                return _draftGrid(draftsList);
              }
            },
          ),
        ),
        bottomNavigationBar: GetBuilder<DraftGxC>(
          init: _draftGxC,
          builder: (controller) =>
              _draftGxC.isEditing && _draftGxC.selectedIndices.isNotEmpty
                  ? Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: _deleteBtn(controller),
                    )
                  : const SizedBox(),
        ),
      );
}

class StorageMediaPostPreview extends StatelessWidget {
  final photo_manager.AssetEntity assetEntity;

  const StorageMediaPostPreview({
    super.key,
    required this.assetEntity,
  });

  Widget _assetImageContainer() => Positioned.fill(
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: Colors.black,
          ),
          child: Common().clipIt(
            radius: 10,
            child: photo_manager.AssetEntityImage(
              assetEntity,
              isOriginal: false,
              thumbnailSize: const photo_manager.ThumbnailSize.square(
                THUMBNAIL_SIZE_VALUE,
              ),
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
      );

  Widget _videoDurationWidget() => Positioned.fill(
        child: Align(
          alignment: Alignment.bottomLeft,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Text(
              CreatePostCommon()
                  .formatDurationToMinuteAndSecond(assetEntity.videoDuration),
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      );

  Widget _videoThumbnailIcon() => Align(
        child: WildrIcon(
          WildrIcons.videoThumbnailIcon,
          color: WildrColors.gray100,
          size: (Get.width / 3) / 4,
        ),
      );

  @override
  Widget build(BuildContext context) => Stack(
        children: [
          _assetImageContainer(),
          if (assetEntity.type == photo_manager.AssetType.video) ...[
            _videoDurationWidget(),
            _videoThumbnailIcon(),
          ],
        ],
      );
}

class _DraftItem extends StatefulWidget {
  final PostSettingsDraft draft;
  final bool isEditing;
  final VoidCallback onItemTap;
  final int index;
  final List<int> selectedDrafts;
  final Challenge? defaultSelectedChallenge;

  const _DraftItem({
    required this.draft,
    required this.isEditing,
    required this.onItemTap,
    required this.index,
    required this.selectedDrafts,
    this.defaultSelectedChallenge,
  });

  @override
  State<_DraftItem> createState() => _DraftItemState();
}

class _DraftItemState extends State<_DraftItem> {
  late List<PostData> postDataList = [];
  late Future<void> _fetchData;

  @override
  void initState() {
    _fetchData = setListData();
    super.initState();
  }

  Future<void> setListData() async {
    final List<dynamic> jsonDataList = jsonDecode(widget.draft.postsData!);
    for (final jsonData in jsonDataList) {
      final String type = jsonData['type'];
      final Map<String, dynamic> data = jsonData['data'];

      switch (type) {
        case 'PostData':
          postDataList.add(PostData.fromJson(data));
        case 'TextPostData':
          postDataList.add(TextPostData.fromJson(data));
        case 'ImagePostData':
          postDataList.add(ImagePostData.fromJson(data));
        case 'AssetPostData':
          final value = await StorageMediaPostData.fromJson(data);
          postDataList.add(value);
        case 'VideoPostData':
          postDataList.add(VideoPostData.fromJson(data));
      }
    }
  }

  Widget _textPostPreview(List<Segment> segments) => Container(
        width: 32.0.w,
        height: 45.0.h,
        decoration: BoxDecoration(
          color: WildrColors.textPostBGColor(context),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Center(
          child: SmartTextCommon().getAutoResizeText(
            segmentsOrCaption: segments,
            context: context,
          ),
        ),
      );

  Widget _imagePostPreview(File imageFile) => DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Common().clipIt(
          radius: 10,
          child: Image.file(
            imageFile,
            fit: BoxFit.contain,
          ),
        ),
      );

  Widget _storageMediaPreview(photo_manager.AssetEntity assetEntity) =>
      StorageMediaPostPreview(assetEntity: assetEntity);

  Widget _videoPostPreview(VideoPostData postData) => Common().clipIt(
        radius: 10,
        child: SizedBox(
          width: 32,
          height: 45,
          child: Stack(
            fit: StackFit.expand,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Common().clipIt(
                  radius: 10,
                  child: Image.file(
                    File(postData.thumbFile?.path ?? ''),
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              _videoThumbnailIcon(),
            ],
          ),
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
      return Common().clipIt(
        radius: 10,
        child: _storageMediaPreview(postData.assetEntity!),
      );
    } else if (postData is VideoPostData) {
      return _videoPostPreview(postData);
    } else {
      return Text(AppLocalizations.of(context)!.createPost_unsupportedMedia);
    }
  }

  Widget _somethingWentWrong() => const Text(kSomethingWentWrong);

  Widget _loader() => const Center(child: CircularProgressIndicator());

  void _onDraftItemTap() {
    if (widget.isEditing) {
      widget.onItemTap();
    } else {
      final CreatePostGxC createPostGxC = Get.put(CreatePostGxC());
      // ignore: cascade_invocations
      createPostGxC.posts = postDataList;
      context.pushRoute(
        DraftPreviewPageRoute(
          defaultSelectedChallenge: widget.defaultSelectedChallenge,
          createPostGxC: createPostGxC,
          draft: widget.draft,
        ),
      );
    }
  }

  Widget _postCount() => Positioned(
        right: 10,
        bottom: 10,
        child: Container(
          width: 25,
          height: 25,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white24,
            borderRadius: BorderRadius.circular(3),
          ),
          child: Text(
            postDataList.length.toString(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  Widget _editingOption() => Positioned(
        right: 10,
        top: 10,
        child: CircularContainer(
          isSelected: widget.selectedDrafts.contains(widget.index),
        ),
      );

  @override
  Widget build(BuildContext context) => FutureBuilder<void>(
        future: _fetchData,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _loader();
          } else if (snapshot.hasError) {
            return _somethingWentWrong();
          } else {
            return GestureDetector(
              onTap: _onDraftItemTap,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: _postPreview(
                      postDataList.last,
                    ),
                  ),
                  if (widget.isEditing) _editingOption() else const SizedBox(),
                  _postCount(),
                ],
              ),
            );
          }
        },
      );
}

class CircularContainer extends StatelessWidget {
  final bool isSelected;

  const CircularContainer({super.key, required this.isSelected});

  @override
  Widget build(BuildContext context) => Container(
        width: 25,
        height: 25,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? WildrColors.emerald900 : Colors.white,
            width: 3,
          ),
          color: isSelected ? WildrColors.emerald900 : Colors.transparent,
        ),
        child: isSelected
            ? const Align(
                child: Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 12,
                ),
              )
            : null,
      );
}
