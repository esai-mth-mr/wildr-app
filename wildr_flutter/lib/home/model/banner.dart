// ignore_for_file: lines_longer_than_80_chars

class BannerModel {
  const BannerModel({
    required this.id,
    required this.title,
    this.description,
    required this.cta,
    this.asset,
  });

  final String id;
  final String title;
  final String? description;
  final String cta;
  final String? asset;

  BannerModel.fromJson(Map<String, dynamic>? map)
      : id = map?['id'] ?? '',
        title = map?['title'] ?? '',
        description = map?['description'],
        cta = map?['cta'] ?? '',
        asset = _unwrapAssetUrl(map);

  static String? _unwrapAssetUrl(Map<String, dynamic>? map) {
    final asset = map?['asset'];
    final source = asset?['source'];
    final uri = source?['uri'];
    return uri;
  }

  BannerModel.test()
      : id = '1-abc-234',
        title = 'Test title',
        description = 'Test description',
        cta = 'Click me',
        asset =
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpZKA_2SQJAaj-NtkHckKot0Lux_SwM5WI7McK2wc&s';

  @override
  String toString() =>
      'BannerModel(id: $id, title: $title, description: $description, cta: $cta, asset: $asset)';
}
