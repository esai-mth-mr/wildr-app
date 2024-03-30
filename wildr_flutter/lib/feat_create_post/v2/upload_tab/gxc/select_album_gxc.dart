import 'package:get/get.dart';
import 'package:photo_manager/photo_manager.dart';

class SelectAlbumGxC extends GetxController {
  final Rx<AssetPathEntity> _selectedAssetPathEntity =
      AssetPathEntity(id: '', name: 'Select Album').obs;

  AssetPathEntity get selectedAssetPathEntity => _selectedAssetPathEntity.value;

  set selectedAssetPathEntity(AssetPathEntity value) =>
      _selectedAssetPathEntity.value = value;

  final RxList<AssetEntity> assetEntities = <AssetEntity>[].obs;

  set assetEntities(List<AssetEntity> value) => assetEntities.value = value;

  void clearAll() {
    selectedAssetPathEntity = AssetPathEntity(id: '', name: 'Select Album');
    assetEntities = <AssetEntity>[];
    assetEntities.clear();
  }
}
