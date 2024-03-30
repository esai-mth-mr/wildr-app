import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_access_control_data.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/feat_post/post_overlay/post_overlay_type.dart';
import 'package:wildr_flutter/home/model/access_control_context/comment_posting_access_control_context.dart';
import 'package:wildr_flutter/home/model/access_control_context/comment_visibility_access_control_context.dart';
import 'package:wildr_flutter/home/model/access_control_context/repost_access_context.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/comment.dart';
import 'package:wildr_flutter/home/model/post_base_type_enum.dart';
import 'package:wildr_flutter/home/model/repost_meta.dart';
import 'package:wildr_flutter/home/model/timestamp.dart';

void print(dynamic message) {
  debugPrint('PostPOJO: $message');
}

class SubPost extends Post {
  SubPost.empty() : super.empty();
}

class ChallengeOrPost {
  late String id;
  Author author = Author.placeholder();
  TimeStamp? timeStamp;
  List<Segment>? caption;
  CommentVisibilityACC? commentVisibilityACC;
  CommentPostingACC? commentPostingACC;
  Comment? pinnedComment;

  bool get canComment => commentPostingACC?.canComment ?? false;
}

class Post extends ChallengeOrPost {
  String? cursor;
  PostStats stats = PostStats.zero();
  PostContext postContext = PostContext.reset();
  bool? willBeDeleted;
  bool isPrivate = false;
  PostAccessControlData? accessControlData;
  RepostMeta? repostMeta;
  Challenge? parentChallenge;
  bool? isPinnedToChallenge;
  bool? isHiddenOnChallenge;

  RepostAccessControlContext? repostAccessControlContext;

  // @Deprecated('Will be removed in future release. Use SubPost instead')
  int type = 1;
  String? bodyText;

  String mediaPath = 'https://dummyimage.com/300/09f/fff.png';
  String? thumbnail;
  List<SubPost>? subPosts;
  SensitiveStatus? sensitiveStatus;
  PostBaseType baseType = PostBaseType.POST;

  PostOverlayType get overlay => (isHiddenOnChallenge ?? false)
      ? PostOverlayType.POST_TO_VIEW
      : sensitiveStatus != null
          ? PostOverlayType.NSFW
          : PostOverlayType.NONE;

  void _createCaptionSegments(Map<String, dynamic> content) {
    final List listOfSegments = content['segments'];
    caption =
        listOfSegments.map((element) => Segment.fromJson(element)).toList();
  }

  List<Segment> _getSegments(Map<String, dynamic> content) {
    final List listOfSegments = content['segments'];
    return listOfSegments.map((element) => Segment.fromJson(element)).toList();
  }

  SensitiveStatus? _toSensitiveStatus(String? sensitiveStatus) {
    if (sensitiveStatus == null) return null;
    switch (sensitiveStatus) {
      case 'NSFW':
        return SensitiveStatus.NSFW;
    }
    return null;
  }

  void _handleImageOrVideoPost(
    Map<String, dynamic> node,
    Map<String, dynamic>? imageOrVideoObj,
  ) {
    if (imageOrVideoObj != null) {
      mediaPath = imageOrVideoObj['source']['uri'];
      final caption = node['caption'];
      if (caption != null) {
        bodyText = node['caption']['body'];
        if (caption['segments'] != null) {
          _createCaptionSegments(caption);
        }
      }
    }
    final thumbnailObj = node['thumbnail'];
    if (thumbnailObj != null) {
      thumbnail = thumbnailObj['source']['uri'];
    }
  }

  void _handleMultiMediaPost(
    Map<String, dynamic> node, {
    bool forActivity = false,
  }) {
    type = 4;
    final caption = node['caption'];
    if (caption != null) {
      bodyText = node['caption']['body'];
      if (caption['segments'] != null) {
        _createCaptionSegments(caption);
      }
    }
    final thumbnail = node['thumbnail'];
    if (thumbnail != null) {
      this.thumbnail = thumbnail['source']['uri'];
    }
    willBeDeleted = node['willBeDeleted'];
    sensitiveStatus = _toSensitiveStatus(node['sensitiveStatus']);
    isPrivate = node['isPrivate'] ?? true;
    final properties = node['properties'];
    if (properties != null) {
      final List props = properties as List;
      subPosts = [];
      const int index = 0;
      for (final element in props) {
        final Map<String, dynamic> prop = element;
        final String typename = prop['__typename'];
        final SubPost subPost = SubPost.empty();
        if (typename == 'TextPostProperties') {
          subPost.type = 1;
          if (prop['content'] != null) {
            if (prop['content']['segments'] != null) {
              subPost.caption = _getSegments(prop['content']);
            }
            if (prop['content']['body'] != null) {
              subPost.bodyText = prop['content']['body'];
            }
          }
        } else if (typename == 'ImagePostProperties') {
          subPost
            ..type = 2
            ..mediaPath = prop['image']?['source']['uri'] ?? ''
            ..thumbnail = prop['thumbnail']?['source']['uri'];
        } else if (typename == 'VideoPostProperties') {
          subPost
            ..type = 3
            ..mediaPath = prop['video']?['source']['uri'] ?? ''
            ..thumbnail = prop['thumbnail']?['source']['uri'];
        }
        subPosts!.add(subPost);
        if (forActivity && index == 0) {
          break;
        }
      }
    }
  }

  void _parseRepostMeta(Map<String, dynamic>? repostMetaMap) {
    if (repostMetaMap == null) return;
    repostMeta = RepostMeta.fromJson(repostMetaMap);
  }

  void _parseAccessControlContext(Map<String, dynamic>? map) {
    if (map == null) return;
    if (map['commentVisibilityAccessControlContext'] != null) {
      commentVisibilityACC = CommentVisibilityACC.fromJson(
        map['commentVisibilityAccessControlContext'],
      );
    }
    if (map['commentPostingAccessControlContext'] != null) {
      commentPostingACC =
          CommentPostingACC.fromJson(map['commentPostingAccessControlContext']);
    }
    if (map['repostAccessControlContext'] != null) {
      repostAccessControlContext =
          RepostAccessControlContext(map['repostAccessControlContext']);
    }
  }

  void _fromNode(Map<String, dynamic> node) {
    id = node['id'];
    author = node['author'] == null
        ? Author.empty()
        : Author.fromJson(node['author']);
    timeStamp = TimeStamp.fromJson(node['ts']);
    baseType = postBaseTypeFromGqlPostBaseType(node['baseType']);
    stats = PostStats.fromJson(node['stats']);
    if (node['postContext'] != null) {
      postContext = PostContext.fromJson(node['postContext']);
    }
    if (node['pinnedComment'] != null) {
      pinnedComment = Comment.fromJson(node['pinnedComment']);
    }
    isPrivate = node['isPrivate'] ?? true;
    willBeDeleted = node['willBeDeleted'];
    sensitiveStatus = _toSensitiveStatus(node['sensitiveStatus']);
    final String type = node['__typename'];
    if (type == 'TextPost') {
      this.type = 1;
      final content = node['content'];
      if (content != null) {
        bodyText = content['body'] ?? '--';
        if (content['segments'] != null) {
          _createCaptionSegments(content);
        }
      }
    } else if (type == 'ImagePost') {
      this.type = 2;
      final imageObj = node['image'];
      _handleImageOrVideoPost(node, imageObj);
    } else if (type == 'VideoPost') {
      this.type = 3;
      final videoObj = node['video'];
      _handleImageOrVideoPost(node, videoObj);
    } else if (type == 'MultiMediaPost') {
      _handleMultiMediaPost(node);
    }
    final Map<String, dynamic>? accessControlDataMap = node['accessControl'];
    if (accessControlDataMap != null) {
      accessControlData = PostAccessControlData.fromJson(accessControlDataMap);
      if (accessControlData?.postVisibility ==
          PostVisibilityAccess.INNER_CIRCLE) {
        author.isInInnerCircle = true;
      }
    }
    if (node['parentChallenge'] != null) {
      parentChallenge = Challenge.fromJson(node['parentChallenge']);
    }
    isPinnedToChallenge = node['isPinnedToChallenge'] ?? false;
    isHiddenOnChallenge = node['isHiddenOnChallenge'];
    _parseRepostMeta(node['repostMeta']);
    _parseAccessControlContext(node);
  }

  Post.fromNode(Map<String, dynamic> node) {
    _fromNode(node);
  }

  Post.fromEdge(Map<String, dynamic> edge) {
    cursor = edge['cursor'];
    final node = edge['node'];
    _fromNode(node);
  }

  Post.forActivity(Map<String, dynamic> map) {
    id = map['id'];
    isHiddenOnChallenge = map['isHiddenOnChallenge'];
    final String type = map['__typename'];
    baseType = postBaseTypeFromGqlPostBaseType(map['baseType']);
    switch (type) {
      case 'TextPost':
        this.type = 1;
        final content = map['content'];
        if (content != null) {
          bodyText = content['body'] ?? '--';
          if (content['segments'] != null) {
            _createCaptionSegments(content);
          }
        }
      case 'ImagePost':
        this.type = 2;
        final imageObj = map['image'];
        _handleImageOrVideoPost(map, imageObj);
      case 'VideoPost':
        this.type = 3;
        final videoObj = map['video'];
        _handleImageOrVideoPost(map, videoObj);
      case 'MultiMediaPost':
        _handleMultiMediaPost(map, forActivity: true);
    }
  }

  Post.empty() {
    id = '';
    author = Author.empty();
    timeStamp = TimeStamp();
  }

  Map<String, dynamic> toJson() => {
        'cursor': cursor,
        'id': id,
        'author': author,
        'timeStamp': timeStamp,
        'type': type,
        'bodyText': bodyText,
        'mediaPath': mediaPath,
        'thumbnail': thumbnail,
        'stats': stats,
        'postContext': postContext,
      };

  bool isDeleted() => willBeDeleted ?? false;

  bool get isNotDeleted => !isDeleted();

  bool isStory() =>
      baseType == PostBaseType.STORY || baseType == PostBaseType.REPOST_STORY;

  bool isRepost() =>
      baseType == PostBaseType.REPOST || baseType == PostBaseType.REPOST_STORY;

  bool isParentPostDeleted() {
    if (baseType == PostBaseType.POST) return false;
    return repostMeta?.isParentPostDeleted ?? false;
  }

  bool get isParentPostNotDeleted => !isParentPostDeleted();

  bool canRepost() {
    final hasRepostAccess = repostAccessControlContext?.canRepost ?? false;
    if (parentChallenge != null) {
      return hasRepostAccess && isHiddenOnChallenge == false;
    }
    return hasRepostAccess;
  }

  bool hasReposted() => repostAccessControlContext?.hasReposted ?? false;

  @override
  String toString() => 'Post{cursor: $cursor, '
      'id: $id, '
      'author: $author, '
      'timeStamp: $timeStamp, '
      'stats: $stats, '
      'postContext: $postContext, '
      'pinnedComment: $pinnedComment, '
      'canComment: $canComment, '
      'type: $type, '
      'bodyText: $bodyText, '
      'segmentsOrCaption: $caption, '
      'mediaPath: $mediaPath, '
      'thumbnail: $thumbnail, '
      'isPrivate: $isPrivate, '
      'sensitiveStatus: $sensitiveStatus, '
      'subPosts: $subPosts}';
}

class PostStats {
  int likeCount = 0;
  int realCount = 0;
  int applauseCount = 0;
  int shareCount = 0;
  int repostCount = 0;
  int commentCount = 0;

  PostStats.zero() {
    likeCount = 0;
    shareCount = 0;
    repostCount = 0;
    commentCount = 0;
  }

  PostStats.copy(PostStats obj)
      : likeCount = obj.likeCount,
        realCount = obj.realCount,
        applauseCount = obj.applauseCount,
        shareCount = obj.shareCount,
        repostCount = obj.repostCount,
        commentCount = obj.commentCount;

  PostStats.fromJson(Map<String, dynamic>? stats) {
    if (stats == null) {
      PostStats.zero();
      return;
    }
    likeCount = stats['likeCount'];
    shareCount = stats['shareCount'];
    repostCount = stats['repostCount'];
    commentCount = stats['commentCount'];
    realCount = stats['realCount'] ?? 0;
    applauseCount = stats['applauseCount'] ?? 0;
  }

  Map<String, dynamic> toJson() => {
        'likeCount': likeCount,
        'realCount': realCount,
        'applauseCount': applauseCount,
        'shareCount': shareCount,
        'repostCount': repostCount,
        'commentCount': commentCount,
      };

  @override
  String toString() => toJson().toString();
}

class PostContext {
  late bool hasLiked;
  late bool hasRealed;
  late bool hasApplauded;
  late bool isFollowingAuthor;
  late bool hasReposted;

  PostContext.reset() {
    hasLiked = false;
    hasRealed = false;
    hasApplauded = false;
    isFollowingAuthor = false;
    hasReposted = false;
  }

  PostContext.copy(PostContext obj)
      : hasLiked = obj.hasLiked,
        hasRealed = obj.hasRealed,
        hasApplauded = obj.hasApplauded,
        isFollowingAuthor = obj.isFollowingAuthor,
        hasReposted = obj.hasReposted;

  PostContext.fromJson(Map<String, dynamic> userContext) {
    hasLiked = userContext['liked'] ?? false;
    hasRealed = userContext['realed'] ?? false;
    hasApplauded = userContext['applauded'] ?? false;
    isFollowingAuthor = userContext['followingUser'] ?? false;
    hasReposted = userContext['reposted'] ?? false;
  }

  Map<String, dynamic> toJson() => {
        'liked': hasLiked,
        'hasRealed': hasRealed,
        'hasApplauded': hasApplauded,
        'followingUser': isFollowingAuthor,
        'reposted': hasReposted,
      };

  @override
  String toString() => toJson().toString();
}

enum SensitiveStatus { NSFW }
