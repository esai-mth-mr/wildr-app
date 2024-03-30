part of '../common.dart';

extension ImageProvidersExtOnCommon on Common {
  // TODO: This should use a ResizeImage too.
  ImageProvider? getImageProvider(AvatarImage? avatarImage) {
    final url = avatarImage?.url;

    if (url == null) return null;

    return cacheImageProvider(url);
  }

  // Returns an image provider for user avatars.
  //
  // Returns null when url is null.
  ImageProvider? getAvatarImageProvider(AvatarImage? avatarImage) {
    final url = avatarImage?.url;

    if (url == null) return null;

    return ResizeImage(
      cacheImageProvider(url),
      // Note: 200 x 200 is chosen because smaller values 24/48 caused a drop in
      // quality while this did not. See JIRA:WILDR-5679 for diffs.
      width: 200,
      height: 200,
    );
  }

  ImageProvider cacheImageProvider(String url) => CachedNetworkImageProvider(
      url,
      cacheKey: Uri.parse(url).path,
      cacheManager: WildrImageCacheManager(),
    );
}
