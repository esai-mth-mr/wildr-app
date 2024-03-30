part of 'post_widget.dart';

class PostImageBody extends StatelessWidget {
  final String mediaPath;
  final String? fallbackImageUrl;
  final bool isImageFromFile;

  PostImageBody(this.mediaPath, {this.fallbackImageUrl, super.key})
      : isImageFromFile = mediaPath.contains('compressed_');

  @override
  Widget build(BuildContext context) => SizedBox(
      width: Get.width,
      child: isImageFromFile
          ? Image.file(
              File(mediaPath),
              fit: BoxFit.fill,
            )
          : Common().imageView(
              mediaPath,
              fallbackImageUrl: fallbackImageUrl,
            ),
    );
}
