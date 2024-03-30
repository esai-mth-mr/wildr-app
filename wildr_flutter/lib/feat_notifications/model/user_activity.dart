import 'package:flutter/cupertino.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/home/model/comment.dart';
import 'package:wildr_flutter/home/model/reply.dart';
import 'package:wildr_flutter/home/model/timestamp.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

void print(String message) {
  debugPrint('[UserActivity] $message');
}

class UserActivity {
  late final String cursor;
  late final String id;
  late final UserActivityTypeEnum type;
  late final TimeStamp ts;
  int? totalCount;
  late List<WildrUser> subjects;
  late final UserActivityObjectTypeEnum objectType;
  late final UserActivityVerbEnum verb;

  String? dataPayload;
  String? displayBodyStr;
  Post? objectPost;
  Reply? objectReply;
  Comment? objectComment;
  Challenge? objectChallenge;
  WildrUser? objectUser;
  late final MiscObjectTypeEnum miscObjectType;
  Post? miscPost;
  Comment? miscComment;

  UserActivity.fromEdge(Map<String, dynamic> edge) {
    cursor = edge['cursor'];
    final Map<String, dynamic>? node = edge['node'];
    if (node == null) {
      _empty();
      return;
    }
    id = node['id'];
    type = _getTypeEnum(node['type']);
    ts = TimeStamp.fromJson(node['ts']);
    totalCount = node['totalCount'];
    displayBodyStr = node['displayBodyStr'];
    dataPayload = node['dataPayload'];
    final List<dynamic>? subjects = node['subjects'];
    if (subjects == null) {
      this.subjects = [];
    } else {
      this.subjects = [];
      for (final map in subjects) {
        final user = WildrUser.fromJson(map);
        this.subjects.add(user);
      }
    }

    objectType = _getObjectType(node['objectType']);
    final Map<String, dynamic>? object = node['object'];
    final Map<String, dynamic>? miscObject = node['miscObject'];
    if (object == null) {
      return;
    }
    verb = getVerb(node['verb']);
    switch (objectType) {
      case UserActivityObjectTypeEnum.NONE:
        break;
      case UserActivityObjectTypeEnum.IMAGE_POST:
      case UserActivityObjectTypeEnum.VIDEO_POST:
      case UserActivityObjectTypeEnum.TEXT_POST:
      case UserActivityObjectTypeEnum.MULTI_MEDIA_POST:
        objectPost = Post.forActivity(object);
      case UserActivityObjectTypeEnum.COMMENT:
        objectComment = Comment.forActivity(object);
        if (miscObject != null) miscPost = Post.forActivity(miscObject);
      case UserActivityObjectTypeEnum.REPLY:
        objectReply = Reply.forActivity(object);
        if (miscObject != null) miscPost = Post.forActivity(miscObject);
      case UserActivityObjectTypeEnum.USER:
        objectUser = WildrUser.forActivity(object);
        if (verb == UserActivityVerbEnum.MENTIONED_IN_POST ||
            verb == UserActivityVerbEnum.MENTIONED_IN_COMMENT ||
            verb == UserActivityVerbEnum.MENTIONED_IN_REPLY) {
          if (miscObject != null) miscPost = Post.forActivity(miscObject);
        }
      case UserActivityObjectTypeEnum.CHALLENGE:
        objectChallenge = Challenge.forActivity(object);
    }
    if (miscObject != null) miscComment = Comment.forActivity(miscObject);
  }

  void _empty() {
    id = '';
    type = UserActivityTypeEnum.UNKNOWN;
    ts = TimeStamp.fromJson(null);
    subjects = [];
    objectType = UserActivityObjectTypeEnum.NONE;
  }

  UserActivityTypeEnum _getTypeEnum(String typeStr) {
    if (typeStr == 'SINGLE') {
      return UserActivityTypeEnum.SINGLE;
    } else if (typeStr == 'AGGREGATED') {
      return UserActivityTypeEnum.AGGREGATED;
    } else if (typeStr == 'SYSTEM') {
      return UserActivityTypeEnum.SYSTEM;
    } else {
      return UserActivityTypeEnum.UNKNOWN;
    }
  }

  UserActivityObjectTypeEnum _getObjectType(String? type) {
    switch (type ?? '') {
      case 'USER':
        return UserActivityObjectTypeEnum.USER;
      case 'POST_MULTI_MEDIA':
        return UserActivityObjectTypeEnum.MULTI_MEDIA_POST;
      case 'POST_TEXT':
        return UserActivityObjectTypeEnum.TEXT_POST;
      case 'POST_IMAGE':
        return UserActivityObjectTypeEnum.IMAGE_POST;
      case 'POST_VIDEO':
        return UserActivityObjectTypeEnum.VIDEO_POST;
      case 'COMMENT':
        return UserActivityObjectTypeEnum.COMMENT;
      case 'REPLY':
        return UserActivityObjectTypeEnum.REPLY;
      case 'CHALLENGE':
        return UserActivityObjectTypeEnum.CHALLENGE;
      default:
        return UserActivityObjectTypeEnum.NONE;
    }
  }

  static UserActivityVerbEnum getVerb(String? verb) {
    switch (verb ?? '') {
      case 'REACTION_LIKE':
        return UserActivityVerbEnum.REACTION_LIKE;
      case 'REACTION_REAL':
        return UserActivityVerbEnum.REACTION_REAL;
      case 'REACTION_APPLAUD':
        return UserActivityVerbEnum.REACTION_APPLAUD;
      case 'COMMENTED':
        return UserActivityVerbEnum.COMMENTED;
      case 'REPLIED':
        return UserActivityVerbEnum.REPLIED;
      case 'REPOSTED':
        return UserActivityVerbEnum.REPOSTED;
      case 'FOLLOWED':
        return UserActivityVerbEnum.FOLLOWED;
      case 'COMMENT_EMBARGO_LIFTED':
        return UserActivityVerbEnum.COMMENT_EMBARGO_LIFTED;
      case 'REC_FIRST_STRIKE':
        return UserActivityVerbEnum.REC_FIRST_STRIKE;
      case 'REC_SECOND_STRIKE':
        return UserActivityVerbEnum.REC_SECOND_STRIKE;
      case 'REC_FINAL_STRIKE':
        return UserActivityVerbEnum.REC_FINAL_STRIKE;
      case 'POSTED':
        return UserActivityVerbEnum.POSTED;
      case 'IMPROVED_PROFILE_RING':
        return UserActivityVerbEnum.IMPROVED_PROFILE_RING;
      case 'MENTIONED_IN_POST':
        return UserActivityVerbEnum.MENTIONED_IN_POST;
      case 'MENTIONED_IN_COMMENT':
        return UserActivityVerbEnum.MENTIONED_IN_COMMENT;
      case 'MENTIONED_IN_REPLY':
        return UserActivityVerbEnum.MENTIONED_IN_REPLY;
      case 'ADDED_TO_IC':
        return UserActivityVerbEnum.ADDED_TO_IC;
      case 'AUTO_ADDED_TO_IC':
        return UserActivityVerbEnum.AUTO_ADDED_TO_IC;
      case 'AUTO_ADDED_TO_FOLLOWING':
        return UserActivityVerbEnum.AUTO_ADDED_TO_FOLLOWING;
      case 'JOINED_CHALLENGE':
        return UserActivityVerbEnum.JOINED_CHALLENGE;
      case 'CHALLENGE_CREATED':
        return UserActivityVerbEnum.CHALLENGE_CREATED;
      default:
        return UserActivityVerbEnum.UNKNOWN;
    }
  }
}

enum UserActivityObjectTypeEnum {
  NONE,
  IMAGE_POST,
  VIDEO_POST,
  TEXT_POST,
  MULTI_MEDIA_POST,
  COMMENT,
  REPLY,
  USER,
  CHALLENGE,
}

enum MiscObjectTypeEnum { UNKNOWN, POST, COMMENT, REPLY, REVIEW_REPORT_REQUEST }

enum UserActivityVerbEnum {
  UNKNOWN,
  REACTION_LIKE,
  REACTION_REAL,
  REACTION_APPLAUD,
  COMMENTED,
  REPLIED,
  REPOSTED,
  FOLLOWED,
  COMMENT_EMBARGO_LIFTED,
  REC_FIRST_STRIKE,
  REC_SECOND_STRIKE,
  REC_FINAL_STRIKE,
  POSTED,
  IMPROVED_PROFILE_RING,
  MENTIONED_IN_POST,
  MENTIONED_IN_COMMENT,
  MENTIONED_IN_REPLY,
  ADDED_TO_IC,
  AUTO_ADDED_TO_IC,
  AUTO_ADDED_TO_FOLLOWING,
  JOINED_CHALLENGE,
  CHALLENGE_CREATED,
}

enum UserActivityTypeEnum {
  UNKNOWN,
  SINGLE,
  AGGREGATED,
  SYSTEM,
}
