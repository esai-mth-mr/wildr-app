import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class WildrVerifyEvent extends MainBlocEvent {
  final File faceImageFile;
  final File manualReviewFile;

  const WildrVerifyEvent({
    required this.faceImageFile,
    required this.manualReviewFile,
  });

  Future<Map<String, dynamic>> getInput() async {
    final Map<String, dynamic> wildrVerifiedManualReviewInput = {};

    final Uint8List faceImageUint8List = faceImageFile.readAsBytesSync();
    final Uint8List manualReviewUint8List = manualReviewFile.readAsBytesSync();
    final http.MultipartFile faceCompressImageMultipartFile =
        http.MultipartFile.fromBytes(
      'faceImage',
      faceImageUint8List.buffer.asUint8List(),
      filename: 'face_${DateTime.now().second}.webp',
      contentType: http_parser.MediaType('image', 'webp'),
    );
    final http.MultipartFile manualCompressImageMultipartFile =
        http.MultipartFile.fromBytes(
      'manualReview',
      manualReviewUint8List.buffer.asUint8List(),
      filename: 'manual_${DateTime.now().second}.webp',
      contentType: http_parser.MediaType('image', 'webp'),
    );

    wildrVerifiedManualReviewInput['input'] = {
      'faceImage': faceCompressImageMultipartFile,
      'manualReviewImage': manualCompressImageMultipartFile,
    };
    return wildrVerifiedManualReviewInput;
  }
}
