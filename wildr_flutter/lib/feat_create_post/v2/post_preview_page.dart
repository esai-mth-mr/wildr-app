import 'dart:io';
import 'dart:ui' as ui;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:path_provider/path_provider.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v1/image_crop_preview.dart';
import 'package:wildr_flutter/feat_create_post/v1/preview_text_post.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/wildr_video_player.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostPreviewPage extends StatefulWidget {
  final PostData postData;
  final VoidCallback onDelete;
  final double height;
  final CreatePostGxC createPostGxC;
  final int index;

  const PostPreviewPage({
    super.key,
    required this.postData,
    required this.onDelete,
    required this.height,
    required this.createPostGxC,
    required this.index,
  });

  @override
  State<PostPreviewPage> createState() => _PostPreviewPageState();
}

class _PostPreviewPageState extends State<PostPreviewPage> {
  GlobalKey previewContainer = GlobalKey();

  Widget _textPostPreview(List<Segment> segments) => GestureDetector(
        onTap: () {
          widget.createPostGxC.editIndex = widget.index;
          final PostData postData = widget.postData;
          if (postData is TextPostData) {
            context
                .pushRoute(
                  EditTextPostPageRoute(
                    createPostGxC: widget.createPostGxC,
                    textPostData: postData,
                  ),
                )
                .then((value) => setState(() {}));
          }
        },
        child: PreviewTextPost(
          segments,
          widget.height,
          shouldAddDecoration: false,
          addBottomPadding: false,
        ),
      );

  Widget _imagePostPreview(File imageFile) => ImageCropPreview(
        filePath: imageFile.path,
        previewContainer: previewContainer,
      );

  Widget _storageMediaPreview(
    photo_manager.AssetEntity assetEntity,
    String assetPath,
  ) {
    if (assetEntity.type == photo_manager.AssetType.video) {
      return WildrVideoPlayer(
        entity: assetEntity,
      );
    }

    return ImageCropPreview(
      filePath: assetPath,
      previewContainer: previewContainer,
    );
  }

  Widget _postPreview(PostData postData) {
    if (postData is TextPostData) {
      return _textPostPreview(postData.segments ?? []);
    } else if (postData is ImagePostData) {
      return _imagePostPreview(postData.croppedFile!);
    } else if (postData is StorageMediaPostData) {
      return Common().clipIt(
        radius: 10,
        child: _storageMediaPreview(postData.assetEntity!, postData.assetPath),
      );
    } else if (postData is VideoPostData) {
      return Padding(
        padding: EdgeInsets.only(top: AppBar().preferredSize.height),
        child: Common().clipIt(
          radius: 25,
          child: WildrVideoPlayer(
            file: File(postData.originalPath),
          ),
        ),
      );
    }
    return Container(width: 1, height: 1, color: Colors.red); //TODO Change it
  }

  Future<File?> _getCroppedFile(String path) async {
    final boundary = previewContainer.currentContext!.findRenderObject()
        as RenderRepaintBoundary?;
    final image = await boundary!.toImage(pixelRatio: 3);
    final directory = (await getApplicationDocumentsDirectory()).path;
    final byteData = (await image.toByteData(format: ui.ImageByteFormat.png))!;
    final pngBytes = byteData.buffer.asUint8List();
    final imgFile = File('$directory/${DateTime.now()}.png');
    await imgFile.writeAsBytes(pngBytes);
    return imgFile;
  }

  Widget _bottomButtons() => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.postData is TextPostData &&
                      WildrColors.isLightMode(context)
                  ? WildrColors.blankPostAddColor()
                  : WildrColors.white,
            ),
            child: IconButton(
              icon: const WildrIcon(
                WildrIcons.deleteIcon,
                color: WildrColors.black,
                size: 20,
              ),
              onPressed: widget.onDelete,
            ),
          ),
          SizedBox(
            width: 100.0.w,
            height: Get.height * 0.05,
            child: ElevatedButton(
              onPressed: _onDoneTap,
              style: ElevatedButton.styleFrom(
                foregroundColor: WildrColors.appBarColor(),
                backgroundColor: widget.postData is TextPostData &&
                        WildrColors.isLightMode(context)
                    ? WildrColors.blankPostAddColor()
                    : WildrColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    15.0,
                  ),
                ),
              ),
              child: Text(
                AppLocalizations.of(context)!.comm_cap_done,
                style: const TextStyle(color: Colors.black),
              ),
            ),
          ),
        ],
      );

  Future<void> _onDoneTap() async {
    context.loaderOverlay.show();
    final PostData postData = widget.createPostGxC.posts[widget.index];
    if (postData is ImagePostData) {
      postData.croppedFile = await _getCroppedFile(postData.originalPath);
      widget.createPostGxC.update();
    } else if (postData is StorageMediaPostData) {
      if (postData.assetEntity!.type == photo_manager.AssetType.image) {
        final File? originalFile = await _getCroppedFile(postData.assetPath);
        final photo_manager.AssetEntity? imageEntityWithPath =
            await photo_manager.PhotoManager.editor.saveImageWithPath(
          originalFile!.path,
          title: originalFile.path,
        );
        postData..assetEntity = imageEntityWithPath
        ..assetPath = originalFile.path;
        widget.createPostGxC.update();
      }
    }
    context.loaderOverlay.hide();
    await context.popRoute();
  }

  Widget _editButton() => Positioned(
        top: 30,
        right: 10,
        child: GestureDetector(
          onTap: () {
            widget.createPostGxC.editIndex = widget.index;
            final PostData postData = widget.postData;
            if (postData is TextPostData) {
              context
                  .pushRoute(
                    EditTextPostPageRoute(
                      createPostGxC: widget.createPostGxC,
                      textPostData: postData,
                    ),
                  )
                  .then((value) => setState(() {}));
            }
          },
          child: Text(
            AppLocalizations.of(context)!.createPost_edit,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 16,
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor:
            widget.postData is TextPostData && WildrColors.isLightMode(context)
                ? WildrColors.white
                : WildrColors.black,
        body: SafeArea(
          top: false,
          child: Stack(
            children: [
              if (widget.postData is TextPostData)
                _editButton()
              else
                const SizedBox(),
              Column(
                children: [
                  Expanded(child: _postPreview(widget.postData)),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: _bottomButtons(),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
}
