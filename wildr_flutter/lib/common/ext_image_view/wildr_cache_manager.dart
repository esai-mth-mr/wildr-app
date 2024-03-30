import 'dart:io' as io;

import 'package:flutter/foundation.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:http/io_client.dart';
import 'package:http/retry.dart';

class WildrImageCacheManager extends CacheManager with ImageCacheManager {
  static const _key = 'libCustomCacheManagerData';
  static final io.HttpClient _httpClient = io.HttpClient()
    ..idleTimeout = const Duration(seconds: 3);
  static final _retryHttpClient = RetryClient(
    IOClient(_httpClient),
    whenError: (object, stackTrace) {
      debugPrint('[RetryClient] [onError] ${stackTrace.toString()}');
      return true;
    },
    onRetry: (baseRequest, baseResponse, value) {
      debugPrint('[RetryClient] [onRetry] Value = $value');
    },
  );
  static final _fileService = HttpFileService(httpClient: _retryHttpClient);
  static final WildrImageCacheManager _instance = WildrImageCacheManager._();

  factory WildrImageCacheManager() => _instance;

  WildrImageCacheManager._()
      : super(
          Config(
            _key,
            fileService: _fileService,
            stalePeriod: const Duration(minutes: 30),
          ),
        );
}
