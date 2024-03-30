import 'package:collection/collection.dart';
import 'package:wildr_flutter/feat_notifications/model/violated_guideline.dart';

class ReviewReportRequest {
  late String id;
  late String readableId;
  String? comment;
  DateTime? createdAt;
  DateTime? updatedAt;
  ViolatedGuideline? violatedGuideline;
  String? link;

  ReviewReportRequest.fromJson(Map<String, dynamic> json) {
    id = json['id'] ?? '';
    readableId = json['readableId'] ?? '0';
    comment = json['comment'];
    updatedAt =
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null;
    createdAt =
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null;
    violatedGuideline = ViolatedGuideline.values.firstWhereOrNull(
          (type) => type.name == json['violatedGuideline'],
        ) ??
        ViolatedGuideline.NONE;
    link = json['link'];
  }

  @override
  String toString() => 'ReviewReportRequest{id: $id, readableId: $readableId,'
      ' comment: $comment, createdAt: $createdAt,'
      ' updatedAt: $updatedAt,'
      ' violatedGuideline: $violatedGuideline}';
}
