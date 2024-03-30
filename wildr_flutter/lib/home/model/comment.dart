import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/timestamp.dart';

void print(dynamic message) {
  debugPrint('CommentPOJO: $message');
}

enum CommentFlagStatus { FLAGGING, FLAGGED }

class Comment {
  late Author author;
  String? body;
  late String id;
  List<Segment>? segments;
  late TimeStamp ts;
  bool hasPinned = false;
  bool hasLiked = false;
  int replyCount = 0;
  int likeCount = 0;
  bool willBeDeleted = false;
  CommentFlagStatus? flagStatus;
  int _participationType = 0; //Closed

  Comment.empty() {
    author = Author.empty();
    id = '';
    ts = TimeStamp();
  }

  Comment.forActivity(Map<String, dynamic> node) {
    id = node['id'] ?? '';
    final body = node['body'];
    if (body == null) {
      return;
    }
    if (body['segments'] != null) {
      final List listOfSegments = body['segments'];
      segments =
          listOfSegments.map((element) => Segment.fromJson(element)).toList();
    }
    this.body = body['body'] ?? '';
  }

  Comment.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    ts = TimeStamp.fromJson(json['ts']);
    author = json['author'] == null
        ? Author.empty()
        : Author.fromJson(json['author']);
    _parseBodyFromNode(json);
    final commentStats = json['commentStats'];
    if (commentStats != null) {
      likeCount = commentStats['likeCount'] ?? 0;
      replyCount = commentStats['replyCount'] ?? 0;
    }
    final commentContext = json['commentContext'];
    if (commentContext != null) {
      hasLiked = commentContext['liked'];
    }
    _setupParticipationType(json);
  }

  Comment.fromAddComment(Map<String, dynamic> data) {
    final c = data['addComment']['comment'];
    id = c['id'];
    author =
        c['author'] == null ? Author.empty() : Author.fromJson(c['author']);
    _parseBodyFromNode(c);

    ts = TimeStamp.fromJson(c['ts']);
    _setupParticipationType(c);
  }

  Comment.fromEdge(Map<String, dynamic> edge) {
    final node = edge['node'];
    id = node['id'];
    ts = TimeStamp.fromJson(node['ts']);
    author = node['author'] == null
        ? Author.empty()
        : Author.fromJson(node['author']);
    _parseBodyFromNode(node);
    final Map<String, dynamic>? commentStats = node['commentStats'];
    likeCount = commentStats?['likeCount'] ?? 0;
    replyCount = commentStats?['replyCount'] ?? 0;

    final commentContext = node['commentContext'];
    if (commentContext != null) {
      hasLiked = commentContext['liked'];
    }
    _setupParticipationType(node);
  }

  void _parseBodyFromNode(Map<String, dynamic>? node) {
    if (node == null) {
      debugPrint('_parseBodyFromNode() Node == null');
      return;
    }
    final body = node['body'];
    if (body == null) {
      return;
    }
    if (body['segments'] != null) {
      final List listOfSegments = body['segments'];
      segments =
          listOfSegments.map((element) => Segment.fromJson(element)).toList();
    } else {
      this.body = body['body'] ?? '';
    }
  }

  bool isLocked() => participationType == CommentParticipationTypeEnum.FINAL;

  void toggleLockedStatus() {
    if (isLocked()) {
      participationType = CommentParticipationTypeEnum.OPEN;
    } else {
      participationType = CommentParticipationTypeEnum.FINAL;
    }
  }

  void _setupParticipationType(Map<String, dynamic> node) {
    final typeStr = node['participationType'];
    if (typeStr != null) {
      _participationType = getParticipationTypeValue(typeStr);
    }
    //this.participationType = getParticipationTypeEnum(participationType);
  }

  CommentParticipationTypeEnum get participationType =>
      getParticipationTypeEnum(_participationType);

  set participationType(CommentParticipationTypeEnum value) {
    _participationType = getParticipationTypeValue(value.value());
  }

  static CommentParticipationTypeEnum getParticipationTypeEnum(int value) {
    switch (value) {
      case 1:
        return CommentParticipationTypeEnum.OPEN;
      default:
        return CommentParticipationTypeEnum.FINAL;
    }
  }

  static int getParticipationTypeValue(String enumStr) {
    if (enumStr == CommentParticipationTypeEnum.OPEN.value()) {
      return 1;
    } else {
      return 0; //FINAL
    }
  }
}

enum CommentParticipationTypeEnum { FINAL, OPEN }

extension ParseToValue on CommentParticipationTypeEnum {
  String value() => toString().split('.').last;
}
