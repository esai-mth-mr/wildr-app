import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/constants/constants.dart';

extension ParseSmartError on QueryResult {
  String? smartErrorMessage() {
    if (data != null && data!.entries.isNotEmpty) {
      if (data![kNoInternet] != null) {
        return kNoInternetError;
      } else if (data![kLocalError] != null) {
        return kSomethingWentWrong;
      }
      final v = data!.entries.last.value;
      if (v['__typename'] == 'SmartError') {
        return v['message'];
      }
    }
    return null;
  }

  String? postNotFoundErrorMessage() {
    if (data != null && data!.entries.isNotEmpty) {
      final v = data!.entries.last.value;
      if (v['__typename'] == 'PostNotFoundError') {
        return v['message'];
      }
    }
    return null;
  }

  String? askForHandleAndNameErrorMessage() {
    if (data != null && data!.entries.isNotEmpty) {
      final v = data!.entries.last.value;
      if (v['__typename'] == 'AskForHandleAndNameError') {
        return v['message'];
      }
    }
    return null;
  }

  String? handleAlreadyTakenErrorMessage() {
    if (data != null && data!.entries.isNotEmpty) {
      final v = data!.entries.last.value;
      if (v['__typename'] == 'HandleAlreadyTakenError') {
        return v['message'];
      }
    }
    return null;
  }

  TrollDetectedData? trollDetectedData() {
    if (data != null && data!.entries.isNotEmpty) {
      final v = data!.entries.last.value;
      if (v['__typename'] == 'TrollDetectorError') {
        debugPrint('TROLL DETECTOR $v');
        TrollData? data;
        final dataJson = v['data'];
        if (dataJson != null && v['data'] is String) {
          debugPrint('DATA JSON');
          debugPrint(dataJson.toString());
          data = TrollData.fromMap(jsonDecode(dataJson as String));
        }
        final TrollDetectedData detectedData = TrollDetectedData(
          message: v['message'],
          data: data,
        );
        return detectedData;
      }
    }
    return null;
  }

  PostTrollDetectedData? createPostTrollDetectedData() {
    if (data != null && data!.entries.isNotEmpty) {
      final v = data!.entries.last.value;
      if (v['__typename'] == 'TrollDetectorError') {
        debugPrint('TROLL DETECTOR $v');
        final String? message = v['message'];
        final List<int> indices = [];
        final results = v['results'] as List?;
        final List<TrollData> r = [];
        if (results != null) {
          for (final result in results) {
            final TrollData data =
                TrollData.fromMap(jsonDecode(result as String));
            r.add(data);
          }
        }

        if (v['indices'] != null) {
          for (final element in v['indices'] as List) {
            indices.add(element);
          }
        }
        return PostTrollDetectedData(r, indices, message);
      }
    }
    return null;
  }
}
