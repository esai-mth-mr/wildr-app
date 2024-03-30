import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_tab/gxc/select_album_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/widgets/upload/upload_permission_bottom_sheet.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class UploadTab extends StatefulWidget {
  final int maxCount;
  final photo_manager.RequestType resourceRequestType;
  final CreatePostGxC createPostGxC;

  const UploadTab(
    this.maxCount,
    this.resourceRequestType, {
    super.key,
    required this.createPostGxC,
  });

  @override
  State<UploadTab> createState() => _UploadTabState();
}

class _UploadTabState extends State<UploadTab> {
  photo_manager.AssetPathEntity? selectedAlbum;
  List<photo_manager.AssetPathEntity> albumList = [];
  final SelectAlbumGxC _selectAlbumGxC = Get.put(SelectAlbumGxC());
  late CreatePostGxC createPostGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  bool isLoading = true;

  @override
  void initState() {
    createPostGxC = widget.createPostGxC;
    super.initState();
    initializeData();
  }

  void initializeData() {
    MediaDataProvider(context: context)
        .loadAlbumsOrShowPermissionDialog(widget.resourceRequestType)
        .then((value) {
      if (value != null) {
        albumList = value;
        if (albumList.isNotEmpty) {
          selectedAlbum = albumList[0];
        }
      }
      if (_selectAlbumGxC.selectedAssetPathEntity.id.isNotEmpty) {
        selectedAlbum = _selectAlbumGxC.selectedAssetPathEntity;
      }
      if (selectedAlbum != null) {
        isLoading = true;
        MediaDataProvider(context: context)
            .loadAssetsFromAlbum(selectedAlbum!)
            .then((value) {
          _selectAlbumGxC.assetEntities = value;
          isLoading = false;
        });
      } else {
        isLoading = false;
      }
      if (!mounted) return;
      setState(() {});
    });
  }

  Widget storageMediaImageVideoPreview(StorageMediaPostData assetPostData) =>
      GestureDetector(
        onTap: () {
          selectAsset(assetPostData);
        },
        child: GetBuilder<CreatePostGxC>(
          builder: (controller) => Stack(
            children: [
              Positioned.fill(
                child: assetContainer(assetPostData, controller),
              ),
              if (assetPostData.assetEntity!.type ==
                  photo_manager.AssetType.video)
                Positioned.fill(
                  child: alignedVideoDurationLabel(assetPostData),
                ),
              Positioned.fill(
                child: alignedAssetNumberBadge(assetPostData, controller),
              ),
            ],
          ),
        ),
      );

  Widget assetContainer(
    StorageMediaPostData assetPostData,
    CreatePostGxC controller,
  ) {
    final assetEntity = assetPostData.assetEntity;
    if (assetEntity == null) {
      return const SizedBox();
    }
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          width: controller.posts.contains(assetPostData) ? 3 : 1,
          color: controller.posts.contains(assetPostData)
              ? WildrColors.emerald800
              : WildrColors.appBarTextColor(),
        ),
      ),
      child: Common().clipIt(
        radius: 15,
        child: photo_manager.AssetEntityImage(
          assetEntity,
          isOriginal: false,
          thumbnailSize:
              const photo_manager.ThumbnailSize.square(THUMBNAIL_SIZE_VALUE),
          fit: assetEntity.width > assetEntity.height
              ? (assetEntity.type == photo_manager.AssetType.video)
                  ? BoxFit.cover
                  : BoxFit.contain
              : BoxFit.cover,
          errorBuilder: (context, error, stackTrace) =>
              CreatePostCommon().unableToLoadImageText(),
        ),
      ),
    );
  }

  Widget alignedVideoDurationLabel(StorageMediaPostData assetPostData) {
    final assetEntity = assetPostData.assetEntity;
    if (assetEntity == null) {
      return const SizedBox();
    }
    return Align(
      alignment: Alignment.bottomRight,
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
    );
  }

  Widget alignedAssetNumberBadge(
    StorageMediaPostData assetPostData,
    CreatePostGxC controller,
  ) =>
      Align(
        child: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: controller.posts.contains(assetPostData)
                ? WildrColors.emerald800
                : Colors.transparent,
            shape: BoxShape.circle,
          ),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Text(
              '${controller.posts.indexOf(assetPostData) + 1}',
              style: TextStyle(
                color: controller.posts.contains(assetPostData)
                    ? Colors.white
                    : Colors.transparent,
              ),
            ),
          ),
        ),
      );

  void selectAsset(StorageMediaPostData assetPostData) {
    if (createPostGxC.posts.contains(assetPostData)) {
      createPostGxC.posts.remove(assetPostData);
      createPostGxC
        ..postCount -= 1
        ..update();
    } else if (createPostGxC.posts.length < widget.maxCount) {
      if (createPostGxC.posts.length == 5) {
        Common().showGetSnackBar(
          _appLocalizations.createPost_selectUpTo5PostsToShare,
          showIcon: true,
          snackPosition: SnackPosition.TOP,
        );
      } else {
        createPostGxC.posts.add(assetPostData);
        createPostGxC
          ..postCount += 1
          ..update();
        _cropSelectedImageAsset(assetPostData);
      }
    }
  }

  void _cropSelectedImageAsset(assetPostData) {
    if (assetPostData.assetEntity!.type == photo_manager.AssetType.image) {
      context
          .pushRoute(
            PostPreviewPageRoute(
              height: widget.createPostGxC.height,
              postData: assetPostData,
              index: widget.createPostGxC.posts.length - 1,
              createPostGxC: widget.createPostGxC,
              onDelete: () async {
                await CreatePostCommon().showDeletePostBottomSheet(
                  widget.createPostGxC
                      .posts[widget.createPostGxC.posts.length - 1],
                  context,
                  widget.createPostGxC,
                  widget.createPostGxC.posts.length - 1,
                );
              },
            ),
          )
          .then((value) => initializeData());
    }
  }

  StorageMediaPostData getAssetPostData(photo_manager.AssetEntity assetEntity) {
    final StorageMediaPostData assetPostData = StorageMediaPostData();
    assetEntity.file.then((value) {
      assetPostData
        ..assetPath = value!.path
        ..thumbFile = value
        ..compressedFile = value;
    });
    assetEntity.thumbnailData.then((value) => assetPostData.thumbData = value);
    assetPostData.assetEntity = assetEntity;
    return assetPostData;
  }

  Widget _selectAlbumButton() {
    if (_selectAlbumGxC.assetEntities.isNotEmpty) {
      return InkWell(
        onTap: () {
          _selectAlbumGxC.update();
          context.pushRoute(SelectAlbumPageRoute(albumList: albumList));
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _selectAlbumGxC.selectedAssetPathEntity.id == ''
                    ? selectedAlbum?.name ?? ''
                    : _selectAlbumGxC.selectedAssetPathEntity.name,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(width: 4),
              const WildrIcon(WildrIcons.expandIcon, size: 22),
            ],
          ),
        ),
      );
    } else {
      return const SizedBox();
    }
  }

  Widget _assetsGrid() => FutureBuilder<photo_manager.PermissionState>(
        future: photo_manager.PhotoManager.requestPermissionExtend(),
        builder: (
          context,
          snapshot,
        ) {
          if (snapshot.connectionState case ConnectionState.waiting) {
            return const SizedBox(
              width: 80,
              height: 80,
              child: Center(
                child: CircularProgressIndicator(),
              ),
            );
          } else {
            if (snapshot.hasData &&
                snapshot.data!.isAuth &&
                snapshot.data!.isAuth) {
              if (_selectAlbumGxC.assetEntities.isEmpty && !isLoading) {
                return const Expanded(
                  child: Center(
                    child: Text(
                      'No media found',
                      style: TextStyle(color: WildrColors.gray700),
                    ),
                  ),
                );
              } else if (isLoading) {
                return const SizedBox(
                  width: 80,
                  height: 80,
                  child: Center(
                    child: CircularProgressIndicator(),
                  ),
                );
              } else {
                return Expanded(
                  child: GridView.builder(
                    physics: const BouncingScrollPhysics(),
                    itemCount: _selectAlbumGxC.assetEntities.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 114 / 164,
                    ),
                    itemBuilder: (context, index) {
                      final photo_manager.AssetEntity assetEntity =
                          _selectAlbumGxC.assetEntities[index];
                      return Padding(
                        padding: const EdgeInsets.all(2),
                        child: storageMediaImageVideoPreview(
                          getAssetPostData(assetEntity),
                        ),
                      );
                    },
                  ),
                );
              }
            } else {
              return UploadPermissionBottomSheet(
                title: 'Photo access required',
                subTitle: 'Please enable access to photos in\nyour'
                    ' device settings to start posting',
                btnTitle: 'Settings',
                onPressed: () {
                  photo_manager.PhotoManager.openSetting().then((value) {
                    initializeData();
                    setState(() {});
                  });
                },
              );
            }
          }
        },
      );

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Padding(
          padding: EdgeInsets.only(
            left: 16.0.w,
            right: 16.0.w,
            bottom: MediaQuery.of(context).padding.bottom + 10.0.w,
          ),
          child: Obx(
            () => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: _selectAlbumGxC.assetEntities.isEmpty
                  ? MainAxisAlignment.center
                  : MainAxisAlignment.start,
              children: [
                _selectAlbumButton(),
                Center(child: _assetsGrid()),
              ],
            ),
          ),
        ),
      );
}

class MediaDataProvider {
  final BuildContext context;

  const MediaDataProvider({required this.context});

  Future loadAlbumsOrShowPermissionDialog(
    photo_manager.RequestType requestType,
  ) async {
    final permission =
        await photo_manager.PhotoManager.requestPermissionExtend();
    List<photo_manager.AssetPathEntity> albumList = [];

    if (permission.isAuth) {
      albumList = await photo_manager.PhotoManager.getAssetPathList(
        type: requestType,
      );
    }

    return albumList;
  }

  Future loadAssetsFromAlbum(
    photo_manager.AssetPathEntity selectedAlbum,
  ) async {
    final List<photo_manager.AssetEntity> assetList =
        await selectedAlbum.getAssetListRange(
      start: 0,
      end: await selectedAlbum.assetCountAsync,
    );
    return assetList;
  }
}
