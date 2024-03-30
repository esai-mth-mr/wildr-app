import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_create_post/common/create_post_common.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_tab/gxc/select_album_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/upload_tab/upload_tab.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class SelectAlbumPage extends StatelessWidget {
  final List<photo_manager.AssetPathEntity> albumList;
  final SelectAlbumGxC _selectAlbumGxC = Get.put(SelectAlbumGxC());

  SelectAlbumPage({super.key, required this.albumList});

  AppBar appBar(BuildContext context) => AppBar(
        centerTitle: true,
        title: Text(AppLocalizations.of(context)!.createPost_selectAlbum),
      );

  Widget _emptyAlbumsLabel(BuildContext context) => Center(
        child: Text(AppLocalizations.of(context)!.createPost_noAlbumFound),
      );

  Widget _albumItem(
    BuildContext context,
    photo_manager.AssetPathEntity assetPathEntityItem,
  ) =>
      FutureBuilder<int>(
        future: assetPathEntityItem.assetCountAsync,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            final assetCount = snapshot.data;
            if (assetCount == 0) {
              return const SizedBox();
            }
            return InkWell(
              onTap: () async {
                context.loaderOverlay.show();
                _selectAlbumGxC.selectedAssetPathEntity = assetPathEntityItem;
                final assets = await MediaDataProvider(context: context)
                    .loadAssetsFromAlbum(assetPathEntityItem);
                _selectAlbumGxC.assetEntities = assets;
                context.loaderOverlay.hide();
                Common().delayIt(
                  () {
                    Navigator.pop(context);
                  },
                  millisecond: 500,
                );
              },
              child: _AlbumItem(
                assetPathEntityItem: assetPathEntityItem,
                assetCount: assetCount ?? 0,
              ),
            );
          } else {
            return const SizedBox();
          }
        },
      );

  Widget _albumListView() => ListView.builder(
        padding: EdgeInsets.only(top: 15.0.w, left: 12.0.w, right: 12.0.w),
        shrinkWrap: true,
        itemBuilder: (context, index) {
          final assetPathEntityItem = albumList[index];
          return _albumItem(context, assetPathEntityItem);
        },
        itemCount: albumList.length,
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: appBar(context),
        body: albumList.isEmpty ? _emptyAlbumsLabel(context) : _albumListView(),
      );
}

class _AlbumItem extends StatelessWidget {
  final photo_manager.AssetPathEntity assetPathEntityItem;
  final int assetCount;
  const _AlbumItem({
    required this.assetPathEntityItem,
    required this.assetCount,
  });

  Widget imageStack(photo_manager.AssetEntity assetEntity) => Stack(
        children: [
          Positioned.fill(
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
              errorBuilder: (context, error, stackTrace) => _errorWidget(),
            ),
          ),
          if (assetEntity.type == photo_manager.AssetType.video)
            Positioned.fill(
              child: Align(
                alignment: Alignment.bottomRight,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 4, right: 5),
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
        ],
      );

  Widget _imageContainer() => Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
        ),
        child: FutureBuilder<photo_manager.AssetEntity?>(
          future: _getImage(),
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              return imageStack(snapshot.data!);
            } else {
              return const SizedBox(
                width: 80,
                height: 80,
                child: Center(
                  child: CircularProgressIndicator(),
                ),
              );
            }
          },
        ),
      );

  Widget _errorWidget() => Center(
        child: CreatePostCommon().unableToLoadImageText(),
      );

  Widget _albumDetailsCard() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            assetPathEntityItem.name,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 5),
          Text(assetCount.toString()),
        ],
      );

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8.0, top: 8.0),
        child: Row(
          children: [
            _imageContainer(),
            const SizedBox(width: 16),
            _albumDetailsCard(),
          ],
        ),
      );

  Future<photo_manager.AssetEntity?> _getImage() async {
    final List<photo_manager.AssetEntity> assets =
        await assetPathEntityItem.getAssetListRange(start: 0, end: 1);
    return assets.isNotEmpty ? assets[0] : null;
  }
}
