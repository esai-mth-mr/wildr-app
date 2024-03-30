import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:reorderables/reorderables.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/dialogs/confirmation_dialog.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/delete_post_preview_bottom_sheet.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

const OPEN_PREVIEW_PAGE = 111;
const OPEN_PREVIEW_PAGE_WITH_NEXT_BUTTON = 112;
const OPEN_UPLOAD_PAGE = 113;
const POP_CURRENT_PAGE = 114;
const SHOULD_CALL_SET_STATE = 115;
const ADD_ANOTHER_POST = 116;
const IS_NOW_EMPTY = 117;

void print(dynamic message) {
  debugPrint('CreatePostCommon: $message');
}

class CreatePostCommon {
  static final CreatePostCommon _instance = CreatePostCommon._internal();

  factory CreatePostCommon() => _instance;

  CreatePostCommon._internal();

  List<Widget> getPreviewBottomSheetTiles({
    required BuildContext context,
    required StateSetter updateState,
    required CreatePostGxC createPostGxC,
    bool shouldShowNextButton = true,
  }) {
    final List<Widget> children = [];

    for (int cardIndex = 0;
        cardIndex < createPostGxC.posts.length;
        cardIndex++) {
      final postData = createPostGxC.posts[cardIndex];
      final Widget card =
          postPreview(context, postData, cardIndex, createPostGxC);
      children.add(card);
    }

    return children;
  }

  List<Widget> getPreviewBottomSheetTilesV1({
    required BuildContext context,
    required StateSetter updateState,
    required CreatePostGxC createPostGxC,
    bool shouldShowNextButton = true,
  }) {
    final List<Widget> children = [];
    for (int cardIndex = 0; cardIndex < createPostGxC.postCount; cardIndex++) {
      final postData = createPostGxC.posts[cardIndex];
      Widget child;
      if (postData is TextPostData) {
        child = Center(
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text.rich(
              SmartTextCommon().createTextSpanFromSegments(
                postData.segments ?? [],
                segmentsLimit: 20,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              maxLines: 8,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Get.theme.textTheme.titleLarge!.color,
              ),
            ),
          ),
        );
      } else if (postData is ImagePostData) {
        child = Image.file(
          postData.croppedFile!,
          //boxFit: BoxFit.cover,
          fit: BoxFit.cover,
          height: double.infinity,
          width: double.infinity,
        );
      } else if (postData is VideoPostData) {
        child = Stack(
          children: [
            Image.file(
              postData.thumbFile!,
              fit: BoxFit.cover,
              height: double.infinity,
              width: double.infinity,
            ),
            Align(
              child: Padding(
                padding: const EdgeInsets.only(right: 5, bottom: 5),
                child: WildrIcon(
                  WildrIcons.play_alt_filled,
                  color: Colors.white,
                  size: (Get.width / 3) / 3,
                ),
              ),
            ),
          ],
        );
      } else {
        child = Container();
      }
      final Widget card = Container(
        width: Get.width * 0.45,
        height: Get.width * 0.45,
        decoration: BoxDecoration(
          // color: Colors.white,
          color: Theme.of(context).colorScheme.background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            width: (createPostGxC.errorIndices.contains(cardIndex)) ? 2.5 : 1.4,
            color: (createPostGxC.errorIndices.contains(cardIndex))
                ? Colors.red
                : Colors.black26,
          ),
        ),
        child: GestureDetector(
          onTap: () {
            debugPrint('Tapped $cardIndex');
            // Navigator.of(context).pop();
            context
                .pushRoute(
              PreviewMultiPostPageRoute(
                createPostGxC: createPostGxC,
                initialIndex: cardIndex,
                shouldShowNextButton: shouldShowNextButton,
              ),
            )
                .then((value) {
              if (value == IS_NOW_EMPTY) {
                Navigator.of(context).pop();
              } else {
                updateState(() {});
              }
            });
          },
          child: AbsorbPointer(
            child: child,
          ),
        ),
      );
      final Widget card2 = SizedBox(
        width: Get.width * 0.45,
        height: Get.width * 0.45,
        child: Stack(
          children: [
            // Common().clipIt(child: card),
            card,
            Align(
              alignment: Alignment.topLeft,
              child: IconButton(
                splashRadius: 0.1,
                padding: EdgeInsets.zero,
                icon: WildrIcon(
                  WildrIcons.minus_circle_outline,
                  color: Colors.red[500]!,
                  // size: 20,
                ),
                onPressed: () {
                  debugPrint(
                    'REMOVNG $cardIndex and ${createPostGxC.errorIndices}',
                  );
                  final List<int> errorIndices = createPostGxC.errorIndices;
                  final List<int> tempList = [];
                  int deletedIndex = -1;
                  for (int index = 0; index < errorIndices.length; index++) {
                    int value = errorIndices[index];
                    if (deletedIndex == -1) {
                      if (value == cardIndex) {
                        deletedIndex = index;
                        continue;
                      }
                    }
                    if (deletedIndex > -1 &&
                        index >= deletedIndex &&
                        value != 999) {
                      value -= 1;
                    }
                    tempList.add(value);
                  }
                  debugPrint(tempList.toString());
                  createPostGxC.errorIndices = tempList;
                  debugPrint(
                    'REMOVNG $cardIndex and ${createPostGxC.errorIndices}',
                  );
                  createPostGxC.removeAt(cardIndex);
                  updateState(() {});

                  if (createPostGxC.postCount == 0) {
                    Navigator.of(context).pop();
                  }
                },
              ),
            ),
          ],
        ),
      );

      children.add(Common().clipIt(child: card2, radius: 14));
      // children.add(card2);
    }
    return children;
  }

  Widget postPreview(
    BuildContext context,
    PostData postData,
    int cardIndex,
    CreatePostGxC createPostGxC,
  ) {
    Widget child;

    if (postData is TextPostData) {
      child = textPostPreview(context, postData);
    } else if (postData is ImagePostData) {
      child = imagePostPreview(postData);
    } else if (postData is VideoPostData) {
      child = videoPostPreview(postData);
    } else if (postData is StorageMediaPostData) {
      child = storageMediaPostPreview(context, postData);
    } else {
      child = Container();
    }

    return postContainer(context, child, cardIndex, createPostGxC);
  }

  Widget textPostPreview(BuildContext context, TextPostData postData) => Center(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text.rich(
            SmartTextCommon().createTextSpanFromSegments(
              postData.segments ?? [],
              segmentsLimit: 20,
            ),
          ),
        ),
      );

  Widget imagePostPreview(ImagePostData postData) => DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          color: Colors.black,
        ),
        child: Common().clipIt(
          radius: 10,
          child: buildImageWidget(postData.croppedFile),
        ),
      );

  Widget buildImageWidget(File? file) => file != null
      ? Image.file(
          file,
          fit: BoxFit.contain,
          height: double.infinity,
          width: double.infinity,
        )
      : unableToLoadImageText();

  Widget buildVideoWidget(File? thumbFile) => Stack(
        children: [
          if (thumbFile != null) ...[
            Common().clipIt(
              radius: 10,
              child: Image.file(
                thumbFile,
                fit: BoxFit.cover,
                height: double.infinity,
                width: double.infinity,
              ),
            ),
            Align(
              child: Padding(
                padding: const EdgeInsets.only(right: 5, bottom: 5),
                child: _videoThumbnailIcon(),
              ),
            ),
          ] else ...[
            unableToLoadImageText(),
          ],
        ],
      );

  Widget videoPostPreview(VideoPostData postData) =>
      buildVideoWidget(postData.thumbFile);

  Widget storageMediaPostPreview(
    BuildContext context,
    StorageMediaPostData postData,
  ) {
    final assetEntity = postData.assetEntity;
    if (assetEntity == null) {
      return unableToLoadImageText();
    }
    return buildAssetWidget(context, assetEntity);
  }

  Widget unableToLoadImageText() => const Text('unable to load image');

  Widget _positionedStorageMedia(AssetEntity assetEntity) => Positioned.fill(
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: Colors.black,
          ),
          child: Common().clipIt(
            radius: 10,
            child: AssetEntityImage(
              assetEntity,
              isOriginal: false,
              thumbnailSize: const ThumbnailSize.square(250),
              fit: calculateBoxFit(assetEntity),
              errorBuilder: (context, error, stackTrace) =>
                  unableToLoadImageText(),
            ),
          ),
        ),
      );

  Widget _positionedVideoDuration(AssetEntity assetEntity) => Positioned.fill(
        child: Align(
          alignment: Alignment.bottomLeft,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Text(
              formatDurationToMinuteAndSecond(
                assetEntity.videoDuration,
              ),
              style: const TextStyle(
                fontSize: 12,
                color: WildrColors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      );

  Widget _videoThumbnailIcon() => WildrIcon(
        WildrIcons.videoThumbnailIcon,
        color: WildrColors.gray100,
        size: (Get.width / 3) / 4,
      );

  Widget buildAssetWidget(BuildContext context, AssetEntity assetEntity) =>
      Stack(
        children: [
          _positionedStorageMedia(assetEntity),
          if (assetEntity.type == AssetType.video) ...[
            Align(
              child: Padding(
                padding: const EdgeInsets.only(right: 5, bottom: 5),
                child: _videoThumbnailIcon(),
              ),
            ),
            _positionedVideoDuration(assetEntity),
          ],
        ],
      );

  Widget postContainer(
    BuildContext context,
    Widget child,
    int cardIndex,
    CreatePostGxC createPostGxC,
  ) =>
      Container(
        width: Get.width * 0.25,
        height: Get.height * 0.18,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: GestureDetector(
          onTap: () {
            debugPrint('Tapped $cardIndex');
            context.pushRoute(
              PostPreviewPageRoute(
                height: createPostGxC.height,
                postData: createPostGxC.posts[cardIndex],
                index: cardIndex,
                createPostGxC: createPostGxC,
                onDelete: () async {
                  await showDeletePostBottomSheet(
                    createPostGxC.posts[cardIndex],
                    context,
                    createPostGxC,
                    cardIndex,
                  );
                  if (createPostGxC.posts.isEmpty) {
                    await context.popRoute();
                  }
                },
              ),
            );
          },
          child: AbsorbPointer(
            child: child,
          ),
        ),
      );

  BoxFit calculateBoxFit(photo_manager.AssetEntity assetEntity) {
    if (assetEntity.width > assetEntity.height) {
      return assetEntity.type == photo_manager.AssetType.video
          ? BoxFit.cover
          : BoxFit.contain;
    } else {
      return BoxFit.cover;
    }
  }

  Widget bottomSheetPreviewButtonV1({
    required BuildContext context,
    required CreatePostGxC createPostGxC,
    shouldShowNextButton = true,
  }) {
    debugPrint('Should show next button = $shouldShowNextButton');
    return Opacity(
      opacity: createPostGxC.postCount == 0 ? 0.2 : 1,
      child: TextButton(
        style: Common().buttonStyle(isFilled: false),
        onPressed: () {
          if (createPostGxC.postCount == 0) {
            return;
          }
          Navigator.pop(
            context,
            shouldShowNextButton
                ? OPEN_PREVIEW_PAGE_WITH_NEXT_BUTTON
                : OPEN_PREVIEW_PAGE,
          );
        },
        child: Text(
          AppLocalizations.of(context)!.createPost_previewUpperCap,
          style: const TextStyle(
            fontSize: 20,
            color: WildrColors.primaryColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget bottomSheetPreviewButton({
    required BuildContext context,
    required CreatePostGxC createPostGxC,
    shouldShowNextButton = true,
  }) {
    debugPrint('Should show next button = $shouldShowNextButton');
    return Container(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
      width: double.infinity,
      child: Opacity(
        opacity: createPostGxC.posts.isEmpty ? 0.2 : 1,
        child: SizedBox(
          height: Get.height * 0.06,
          child: TextButton(
            style: Common().buttonStyle(),
            onPressed: () {
              if (createPostGxC.posts.isEmpty) {
                return;
              }
              Navigator.pop(context);
            },
            child: Text(
              AppLocalizations.of(context)!.comm_cap_done,
              style: const TextStyle(
                fontSize: 16,
                color: WildrColors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget bottomSheetNextButton({
    required BuildContext context,
    required CreatePostGxC createPostGxC,
  }) =>
      Opacity(
        opacity: createPostGxC.postCount == 0 ? 0.2 : 1,
        child: TextButton(
          style: Common().buttonStyle(radius: 25.0, hPadding: 45, vPadding: 10),
          onPressed: () async {
            if (createPostGxC.postCount == 0) {
              return;
            }
            Navigator.of(context).pop(
              OPEN_UPLOAD_PAGE,
            );
          },
          child: Text(
            AppLocalizations.of(context)!.comm_cap_next,
            style: const TextStyle(
              fontSize: 20,
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );

  Future<T?> openPostsBottomSheet<T>({
    required BuildContext context,
    required CreatePostGxC createPostGxC,
    bool shouldShowNextButton = true,
    String? errorTitle,
  }) {
    final Widget bottomButtons = bottomSheetPreviewButton(
      context: context,
      createPostGxC: createPostGxC,
      shouldShowNextButton: shouldShowNextButton,
    );
    return showCupertinoModalBottomSheet(
      context: context,
      useRootNavigator: false,
      isDismissible: true,
      backgroundColor: WildrColors.gray1100,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      builder: (context) => StatefulBuilder(
        builder: (context, updateState) => Material(
          color: WildrColors.bottomSheetCardBGColor(),
          child: SafeArea(
            child: SizedBox(
              height: createPostGxC.posts.isEmpty
                  ? 200
                  : (createPostGxC.posts.length > 3
                      ? createPostGxC.posts.length <= 6
                          ? Get.height * 0.6
                          : Get.height * 0.8
                      : Get.height * 0.4),
              child: Column(
                children: [
                  Common().bottomSheetDragger(),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: ReorderableWrap(
                        header: (createPostGxC.posts.isEmpty)
                            ? []
                            : [
                                if (errorTitle != null)
                                  Center(
                                    child: Text(
                                      errorTitle,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        color: WildrColors.errorColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                Center(
                                  child: Text(
                                    AppLocalizations.of(context)!
                                        .createPost_holdAndDragToRearrange,
                                    style: TextStyle(
                                      color: WildrColors.appBarTextColor(
                                        context,
                                      ),
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                        spacing: 14.0,
                        runSpacing: 10.0,
                        padding: const EdgeInsets.all(8),
                        buildDraggableFeedback: (context, constraints, child) =>
                            Material(
                          color: Colors.transparent,
                          child: ConstrainedBox(
                            constraints: constraints,
                            child: child,
                          ),
                        ),
                        onReorder: (oldIndex, newIndex) {
                          debugPrint('onReorder $oldIndex; $newIndex');
                          updateState(() {
                            final element =
                                createPostGxC.posts.removeAt(oldIndex);
                            debugPrint('element = $element');
                            createPostGxC.posts.insert(newIndex, element);
                            createPostGxC.update();
                            if (createPostGxC.errorIndices.contains(oldIndex)) {
                              createPostGxC.errorIndices.remove(oldIndex);
                              createPostGxC.errorIndices.add(newIndex);
                            }
                          });
                        },
                        children: (createPostGxC.posts.isEmpty)
                            ? [
                                Center(
                                  child: Text(
                                    AppLocalizations.of(context)!
                                        .createPost_addSomePosts,
                                  ),
                                ),
                              ]
                            : getPreviewBottomSheetTiles(
                                context: context,
                                createPostGxC: createPostGxC,
                                updateState: updateState,
                                shouldShowNextButton: shouldShowNextButton,
                              ),
                      ),
                    ),
                  ),
                  if (createPostGxC.posts.isEmpty)
                    const SizedBox()
                  else
                    bottomButtons,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<T?> openPostsBottomSheetV1<T>({
    required BuildContext context,
    required CreatePostGxC createPostGxC,
    bool shouldShowNextButton = true,
    String? errorTitle,
  }) {
    final Widget bottomButtons = Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        bottomSheetPreviewButtonV1(
          context: context,
          createPostGxC: createPostGxC,
          shouldShowNextButton: shouldShowNextButton,
        ),
        if (shouldShowNextButton)
          bottomSheetNextButton(
            context: context,
            createPostGxC: createPostGxC,
          ),
      ],
    );
    return showCupertinoModalBottomSheet(
      context: context,
      useRootNavigator: false,
      isDismissible: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      builder: (context) => StatefulBuilder(
        builder: (context, updateState) => Material(
          child: SafeArea(
            child: SizedBox(
              height: createPostGxC.postCount == 0
                  ? 200
                  : (createPostGxC.postCount > 4
                      ? Get.height * 0.8
                      : Get.height * 0.7),
              child: Column(
                children: [
                  Common().bottomSheetDragger(),
                  Expanded(
                    child: ReorderableWrap(
                      header: (createPostGxC.postCount == 0)
                          ? []
                          : [
                              if (errorTitle != null)
                                Center(
                                  child: Text(
                                    errorTitle,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: WildrColors.errorColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              Center(
                                child: Text(
                                  AppLocalizations.of(context)!
                                      .createPost_holdAndDragToRearrange,
                                  style: TextStyle(
                                    color: WildrColors.textColorStrong(),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ],
                      spacing: 8.0,
                      runSpacing: 10.0,
                      padding: const EdgeInsets.all(8),
                      buildDraggableFeedback: (context, constraints, child) =>
                          Material(
                        color: Colors.transparent,
                        child: ConstrainedBox(
                          constraints: constraints,
                          child: child,
                        ),
                      ),
                      onReorder: (oldIndex, newIndex) {
                        debugPrint('onReorder $oldIndex; $newIndex');
                        updateState(() {
                          final element =
                              createPostGxC.posts.removeAt(oldIndex);
                          debugPrint('element = $element');
                          createPostGxC.posts.insert(newIndex, element);
                          if (createPostGxC.errorIndices.contains(oldIndex)) {
                            createPostGxC.errorIndices.remove(oldIndex);
                            createPostGxC.errorIndices.add(newIndex);
                          }
                        });
                      },
                      children: (createPostGxC.postCount == 0)
                          ? [
                              Center(
                                child: Text(
                                  AppLocalizations.of(context)!
                                      .createPost_addSomePosts,
                                ),
                              ),
                            ]
                          : getPreviewBottomSheetTilesV1(
                              context: context,
                              createPostGxC: createPostGxC,
                              updateState: updateState,
                              shouldShowNextButton: shouldShowNextButton,
                            ),
                    ),
                  ),
                  bottomButtons,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget topRightCounter(
    CreatePostGxC createPostGxC, {
    required GestureTapCallback onTap,
    Color? c,
  }) {
    final Color color = createPostGxC.postCount == 5
        ? Colors.red
        : createPostGxC.animateCounter.value
            ? WildrColors.primaryColor
            : (c ?? Colors.white);
    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.only(
          top: 12,
          bottom: 12,
          right: 12,
        ),
        child: Container(
          width: 30,
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(
              Radius.circular(10),
            ),
            border: Border.all(width: 2, color: color),
          ),
          child: Center(
            child: Text(
              '${createPostGxC.postCount}',
              style: TextStyle(
                fontSize: 18,
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget bottomButtonsRow(Widget button1, Widget button2) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            button1,
            button2,
          ],
        ),
      );

  Widget addButton({
    VoidCallback? onPressed,
    Color? bgColor = WildrColors.primaryColor,
  }) =>
      SizedBox(
        width: 40,
        height: 40,
        child: FloatingActionButton(
          heroTag: 'addButton',
          backgroundColor: bgColor,
          elevation: 0,
          onPressed: onPressed,
          child: const WildrIcon(
            WildrIcons.plus_filled,
            color: Colors.white,
          ),
        ),
      );

  Widget bottomRightButton({
    VoidCallback? onPressed,
    String? text,
    Color? color,
  }) =>
      TextButton(
        style: Common().buttonStyle(color: color),
        onPressed: onPressed,
        child: Text(
          text ?? 'Next',
          style: TextStyle(
            fontSize: 16.6.sp,
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      );

  Future<T?> onCreatePostPageBackPressed<T>(
    BuildContext context,
    CreatePostGxC createPostGxC,
  ) {
    if (createPostGxC.postCount > 0) {
      return showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          title: AppLocalizations.of(context)!
              .challenge_discardChangesQuestionMark,
          description: AppLocalizations.of(context)!
              .createPost_confirmLossOfChangesMessage,
          leftButtonText: AppLocalizations.of(context)!.createPost_discard,
          leftButtonColor: Colors.red,
          isLeftButtonSolid: true,
          leftButtonOnPressed: () {
            Navigator.of(context).pop(POP_CURRENT_PAGE);
          },
          rightButtonText: AppLocalizations.of(context)!.comm_cap_cancel,
          rightButtonOnPressed: () {
            Navigator.of(context).pop(false);
          },
          width: Get.width * 0.5,
        ),
      );
    } else {
      return Future.delayed(const Duration(milliseconds: 1));
    }
  }

  String twoDigits(int n) {
    if (n >= 10) return '$n';
    return '0$n';
  }

  Future showDeletePostBottomSheet(
    PostData? postData,
    BuildContext context,
    CreatePostGxC createPostGxC,
    int cardIndex,
  ) async {
    await showModalBottomSheet(
      barrierColor: WildrColors.black.withOpacity(0.6),
      isScrollControlled: true,
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => DeletePostPreviewBottomSheet(
        title: getDeletePostTitleFromPostData(postData!, context),
        onDeleteTap: () {
          createPostGxC.posts.removeAt(cardIndex);
          createPostGxC..postCount -= 1
          ..update();
          Navigator.pop(context);
        },
        subTitle: AppLocalizations.of(context)!.createPost_thisCanNotBeUndone,
      ),
    );
  }

  String getDeletePostTitleFromPostData(
    PostData postData,
    BuildContext context,
  ) {
    if (postData is TextPostData) {
      return AppLocalizations.of(context)!.createPost_deleteThisText;
    } else if (postData is ImagePostData) {
      return AppLocalizations.of(context)!.createPost_deleteThisPhoto;
    } else if (postData is StorageMediaPostData) {
      if (postData.assetEntity!.type == AssetType.video) {
        return AppLocalizations.of(context)!.createPost_deleteThisClip;
      } else {
        return AppLocalizations.of(context)!.createPost_deleteThisPhoto;
      }
    } else {
      return AppLocalizations.of(context)!.createPost_deleteThisClip;
    }
  }

  Future<bool> shouldShowCreatePostV2() async =>
      Prefs.getBool(PrefKeys.kShouldShowCreatePostV2) ?? false;

  String formatDurationToMinuteAndSecond(Duration duration) {
    final String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    final String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));

    return '$twoDigitMinutes:$twoDigitSeconds';
  }
}
