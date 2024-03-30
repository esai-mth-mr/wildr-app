import 'package:wildr_flutter/common/enums/smart_refresher/smart_refresher_action.dart';

class SmartRefresherError implements Exception {
  final SmartRefresherAction code;
  final String message;

  const SmartRefresherError({
    required this.code,
    required this.message,
  });
}
