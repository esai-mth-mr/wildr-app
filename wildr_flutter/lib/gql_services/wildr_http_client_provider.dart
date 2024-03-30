import 'dart:io';

import 'package:http/http.dart';
import 'package:http/io_client.dart';

class WildrHttpClientProvider {
  late final _httpClient = HttpClient()
    ..idleTimeout = const Duration(seconds: 3);

  late final BaseClient _client = IOClient(_httpClient);

  BaseClient get client => _client;
}
