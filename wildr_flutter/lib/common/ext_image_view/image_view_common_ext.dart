part of '../common.dart';

extension ImageViewCommonExt on Common {
  Widget _imageLoadingShimmer(BuildContext context) =>
      wrapInShimmer(Container(color: Colors.white), context: context);

  Widget _networkImageWithRetry(
    String imageUrl, {
    String? fallbackImageUrl,
    double? height,
    double? width,
    BoxFit? boxFit,
  }) =>
      Image(
        image: NetworkImageWithRetry(
          imageUrl,
          fetchStrategy: defaultFetchStrategy,
        ),
        fit: boxFit ?? BoxFit.cover,
        height: height ?? double.infinity,
        width: width ?? double.infinity,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return _imageLoadingShimmer(context);
        },
        errorBuilder: (
          context,
          error,
          stackTrace,
        ) {
          FirebaseCrashlytics.instance.recordError(
            error,
            stackTrace,
            information: [
              {AnalyticsParameters.kImageUrl: imageUrl},
            ],
          );
          if (fallbackImageUrl != null) {
            debugPrint('Falling back to fallbackImageUrl');
            FirebaseAnalytics.instance.logEvent(
              name: DebugEvents.kDebugFallbackImage,
              parameters: {AnalyticsParameters.kOriginalImageUrl: imageUrl},
            );
            return _networkImageWithRetry(
              fallbackImageUrl,
              height: height,
              width: width,
              boxFit: boxFit,
            );
          }
          return const Center(
            child: Text('Failed to load image.'),
          );
        },
      );

  Widget _cachedImageView(
    String imageUrl, {
    String? fallbackImageUrl,
    double? height,
    double? width,
    BoxFit? boxFit,
    double? borderRadius,
  }) {
    final Widget cachedImage = CachedNetworkImage(
      imageUrl: imageUrl,
      fit: boxFit ?? BoxFit.cover,
      height: height ?? double.infinity,
      width: width ?? double.infinity,
      cacheKey: Uri.parse(imageUrl).path,
      cacheManager: WildrImageCacheManager(),
      progressIndicatorBuilder: (context, url, progress) =>
          _imageLoadingShimmer(context),
      errorWidget: (
        context,
        url,
        dynamic error,
      ) {
        FirebaseCrashlytics.instance.recordError(error, null);
        debugPrint('‼️CachedImageView failed, using _networkImageWithRetry');
        return _networkImageWithRetry(
          imageUrl,
          fallbackImageUrl: fallbackImageUrl,
          height: height,
          width: width,
          boxFit: boxFit,
        );
      },
    );
    if (borderRadius == null) return cachedImage;
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: cachedImage,
    );
  }

  Widget imageView(
    String imageUrl, {
    String? fallbackImageUrl,
    double? height,
    double? width,
    BoxFit? boxFit,
    double? borderRadius,
  }) =>
      _cachedImageView(
        imageUrl,
        fallbackImageUrl: fallbackImageUrl,
        height: height,
        width: width,
        boxFit: boxFit,
        borderRadius: borderRadius,
      );
}
