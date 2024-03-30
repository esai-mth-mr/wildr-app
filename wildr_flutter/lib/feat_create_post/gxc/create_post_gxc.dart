// ignore_for_file: cascade_invocations

import 'dart:io';
import 'dart:typed_data';

import 'package:get/get.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:wildr_flutter/common/enums/comment_scope_enum.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/widgets/mentions_input.dart';

class CreatePostGxC extends GetxController {
// Is loading
  final RxBool _isLoading = false.obs;
  bool get isLoading => _isLoading.value;
  set isLoading(bool value) => _isLoading.value = value;

//Post Count
  final _postCount = 0.obs;
  int get postCount => _postCount.value;
  set postCount(int value) => _postCount.value = value;

//Counter
  var animateCounter = false.obs;
  var opacityEnabled = true.obs;

//Comment Scope
  CommentScope commentScope = CommentScope.ALL;
  bool isStory = false;
  bool isPublic = true;
  bool get isRepost => _repost != null;

  final List<PostData> _postDataList = [];
  List<PostData> get posts => _postDataList;
  set posts(List<PostData> value) {
    posts
      ..clear()
      ..addAll(value);
    postCount = posts.length;
  }

  Post? _repost;

  Post? get repost => _repost;
  set repost(Post? repost) {
    _repost = repost;
    postCount = repost?.subPosts?.length ?? 0;
  }

//UI
  double height = 0;
  bool shouldPop = false;
  int editIndex = -1;
  List<int> errorIndices = [];
  List<TrollData> trollData = [];
  String? caption;

  void addPostData(PostData postData) {
    posts.add(postData);
    postCount += 1;
  }

  void removeAt(int index) {
    posts.removeAt(index);
    postCount -= 1;
  }

  void clearAll() {
    posts.clear();
    postCount = 0;
    shouldPop = false;
    opacityEnabled.value = true;
    errorIndices = [];
    trollData = [];
    commentScope = CommentScope.ALL;
    isStory = false;
    isPublic = true;
    caption = null;
    repost = null;
  }
}

class PostData {
  String body = '';
  List<Segment>? segments;

  Map<String, dynamic>? content;
  PostData();

  PostData.fromJson(Map<String, dynamic> json) {
    body = json['body'] ?? '';
    if (json['segments'] != null) {
      segments = List<Segment>.from(
        json['segments'].map((segment) => Segment.fromJson(segment)),
      );
    }
    content = json['content'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'body': body,
      'segments': segments?.map((segment) => segment.toJson()).toList(),
      'content': content,
    };
    return data;
  }
}

class TextPostData extends PostData {
  String data = '';
  List<RichBlock>? blocks;
  bool? isTrollDetected;
  double negative = 0;

  TextPostData();

  TextPostData.fromJson(Map<String, dynamic> json) : super.fromJson(json) {
    data = json['data'] ?? '';
    isTrollDetected = json['isTrollDetected'] ?? false;
    negative = json['negative'] ?? 0;
    if (json['blocks'] != null) {
      blocks = List<RichBlock>.from(
        json['blocks'].map((block) => RichBlock.fromJson(block)),
      );
    }
  }

  @override
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      ...super.toJson(), // Include base class parameters
      'data': this.data,
      'blocks': blocks?.map((block) => block.toJson()).toList(),
      'isTrollDetected': isTrollDetected,
      'negative': negative,
    };
    return data;
  }
}

class ImagePostData extends PostData {
  String originalPath = '';
  String croppedPath = '';

  File? croppedFile;
  File? thumbFile;
  ImagePostData();

  ImagePostData.fromJson(Map<String, dynamic> json) : super.fromJson(json) {
    originalPath = json['originalPath'] ?? '';
    croppedPath = json['croppedPath'] ?? '';
    croppedFile = croppedPath.isNotEmpty ? File(croppedPath) : null;
    thumbFile = json['thumbPath'] != null ? File(json['thumbPath']) : null;
  }

  @override
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      ...super.toJson(),
      'originalPath': originalPath,
      'croppedPath': croppedPath,
      'thumbPath': thumbFile?.path,
    };
    return data;
  }
}

class StorageMediaPostData extends PostData {
  String assetPath = '';
  Uint8List? thumbData;
  File? thumbFile;
  AssetEntity? assetEntity;
  Uint8List? compressedImageData;
  File? compressedFile;
  StorageMediaPostData();

  static Future<StorageMediaPostData> fromJson(
    Map<String, dynamic> json,
  ) async {
    final assetPostData = StorageMediaPostData()
      ..assetPath = json['assetPath'] ?? ''
      ..thumbData = json['thumbData'] != null
          ? Uint8List.fromList(json['thumbData'].cast<int>())
          : null
      ..compressedImageData = json['compressedImageData'] != null
          ? Uint8List.fromList(json['compressedImageData'])
          : null
      ..compressedFile = json['compressedFilePath'] != null
          ? File(json['compressedFilePath'])
          : null
      ..thumbFile =
          json['thumbFilePath'] != null ? File(json['thumbFilePath']) : null;
    final assetEntityId = json['assetEntity']?['id'];
    if (assetEntityId != null) {
      assetPostData.assetEntity = await AssetEntity.fromId(assetEntityId);
    }

    if (assetPostData.compressedFile != null &&
        assetPostData.compressedImageData != null &&
        !await assetPostData.compressedFile!.exists()) {
      final file = await assetPostData.compressedFile!.create();
      await file.writeAsBytes(assetPostData.compressedImageData!);
      assetPostData.compressedFile = file;
    }

    if (assetPostData.thumbFile != null &&
        assetPostData.thumbData != null &&
        !await assetPostData.thumbFile!.exists()) {
      final file = await assetPostData.thumbFile!.create();
      await file.writeAsBytes(assetPostData.thumbData!);
      assetPostData.thumbFile = file;
    }

    return assetPostData;
  }

  @override
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      ...super.toJson(),
      'assetPath': assetPath,
      'thumbData': thumbData != null ? thumbData!.toList() : null,
      'compressedImageData': compressedImageData?.toList(),
      'compressedFilePath': compressedFile?.path,
      'thumbFilePath': thumbFile != null ? thumbFile!.path : null,
      'assetEntity': assetEntity != null ? {'id': assetEntity!.id} : null,
    };
    return data;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is StorageMediaPostData) {
      return assetEntity?.id == other.assetEntity?.id;
    }
    return false;
  }

  @override
  int get hashCode => assetEntity?.id.hashCode ?? 0;
}

class VideoPostData extends PostData {
  String originalPath = '';
  String thumbPath = '';
  File? thumbFile;
  File? compressedFile;
  bool isFromCamera = false;
  VideoPostData();

  VideoPostData.fromJson(Map<String, dynamic> json) : super.fromJson(json) {
    originalPath = json['originalPath'] ?? '';
    thumbPath = json['thumbPath'] ?? '';
    thumbFile = json['thumbFile'] != null ? File(json['thumbFile']) : null;
    compressedFile =
        json['compressedFile'] != null ? File(json['compressedFile']) : null;
    isFromCamera = json['isFromCamera'] ?? false;
  }

  @override
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      ...super.toJson(), // Include base class parameters
      'originalPath': originalPath,
      'thumbPath': thumbPath,
      'thumbFile': thumbFile?.path,
      'compressedFile': compressedFile?.path,
      'isFromCamera': isFromCamera,
    };
    return data;
  }
}
