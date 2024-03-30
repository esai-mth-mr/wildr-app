import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:photo_manager/photo_manager.dart' as photo_manager;
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_posting_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/comment_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/repost_access.dart';

class GetSinglePostEvent extends MainBlocEvent {
  final String postId;
  final String pageId;

  GetSinglePostEvent({
    required this.postId,
    required this.pageId,
  });

  Map<String, dynamic> variables() => {
        'getPostInput': {'id': postId},
      };

  String query() => r'''
  fragment AuthorFragment on User {
    id
    handle
    avatarImage {
      uri
    }
    score
    isSuspended
    strikeData {
      isFaded
      currentStrikeCount
    }
  }
  fragment ContentFragment on Content {
    body
    segments {
      __typename
      ... on Text {
        chunk
        noSpace
        lang {
          __typename
          code
        }
      }
      ... on Tag {
        id
        name
        noSpace
      }
      ... on User {
        id
        handle
      }
    }
  }
  
  fragment ParentChallengeFragment on Challenge {
    __typename
    id
    name
    currentUserContext {
      hasJoined
    }
  }
  
  query getPost($getPostInput: GetPostInput!) {
    getPost(input: $getPostInput) {
      ... on GetPostResult {
        post {
          __typename
          ... on MultiMediaPost {
          __typename
            id
            willBeDeleted
            isHiddenOnChallenge
            sensitiveStatus
            isPrivate
            author {
              ...AuthorFragment
            }
            accessControl {
              postVisibility
              commentVisibilityAccess
              commentPostingAccess
            }
            ts {
              createdAt
              updatedAt
              expiry
            }
            pinnedComment {
              id
              ts {
                createdAt
                updatedAt
              }
              author {
                ...AuthorFragment
              }
              body {
                body
                ...ContentFragment
              }
            }
            postContext {
              liked
              realed
              applauded
            }
            stats {
              likeCount
              realCount
              applauseCount
              shareCount
              repostCount
              commentCount
              reportCount
            }
            parentChallenge {
              ...ParentChallengeFragment
            }
            caption {
              ...ContentFragment
            }
            repostAccessControlContext {
              cannotRepostErrorMessage
              canRepost
              hasReposted
            }
            baseType
            repostMeta {
              count
              isParentPostDeleted
              parentPost {
                id
                author {
                  id
                  handle
                  score
                  avatarImage {
                    uri
                  }
                }
              }
            }
            properties {
              ... on TextPostProperties {
                __typename
                content {
                  ...ContentFragment
                }
              }
              ... on ImagePostProperties {
                __typename
                image {
                    source {
                    __typename
                    uri
                  }
                }
                thumbnail {
                  source {
                    uri
                  }
                }
              }
              ... on VideoPostProperties {
                __typename
                thumbnail {
                  source {
                    uri
                  }
                }
                video {
                  source {
                    uri
                  }
                }
              }
            }
          }
        }
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
  ''';

  @override
  Map<String, dynamic>? getAnalyticParameters() => {'postId': postId};
}

class CreatePostParentEvent extends MainBlocEvent {
  final bool isStory;
  final String captionData;
  final String? captionBody;

  final PostVisibilityAccess postVisibilityAccess;
  final CommentVisibilityAccess commentVisibilityAccess;
  final CommentPostingAccess commentPostingAccess;
  final RepostAccess repostAccess;

  //Troll Data
  final bool shouldBypassTrollDetection;
  final List<int>? negativeIndices;
  final List<double>? negativeResults;

  CreatePostParentEvent({
    this.captionBody,
    required this.captionData,
    required CreatePostGxC createPostGxC,
    required PostSettingsGxC postSettingsGxC,
    this.negativeIndices,
    this.negativeResults,
    this.shouldBypassTrollDetection = false,
  })  : isStory = createPostGxC.isStory,
        postVisibilityAccess = postSettingsGxC.selectedPostVisibilityAccess,
        commentVisibilityAccess =
            postSettingsGxC.selectedCommentVisibilityAccess,
        commentPostingAccess = postSettingsGxC.selectedCommentPostingAccess,
        repostAccess = postSettingsGxC.repostAccess;

  Map<String, dynamic> postAccessControlRequestVariables() {
    final Map<String, dynamic> accessControl = {};

    final Map<String, dynamic> postVisibilityAccessData = {};
    postVisibilityAccessData['access'] = postVisibilityAccess.name;
    accessControl['postVisibilityAccessData'] = postVisibilityAccessData;

    final Map<String, dynamic> commentVisibilityAccessData = {};
    commentVisibilityAccessData['access'] = commentVisibilityAccess.name;
    accessControl['commentVisibilityAccessData'] = commentVisibilityAccessData;

    final Map<String, dynamic> commentPostingAccessData = {};
    commentPostingAccessData['access'] = commentPostingAccess.name;
    accessControl['commentPostingAccessData'] = commentPostingAccessData;

    final Map<String, dynamic> repostAccessData = {};
    repostAccessData['access'] = repostAccess.name;
    accessControl['repostAccessData'] = repostAccessData;

    return accessControl;
  }

  @override
  Map<String, dynamic> getAnalyticParameters() => {
        AnalyticsParameters.kPostVisibilityAccess: postVisibilityAccess.name,
        AnalyticsParameters.kCommentVisibilityAccess:
            commentVisibilityAccess.name,
        AnalyticsParameters.kCommentPostingAccess: commentPostingAccess.name,
        AnalyticsParameters.kRepostAccess: repostAccess.name,
        AnalyticsParameters.kIsStory: isStory.toString(),
        AnalyticsParameters.kShouldBypassTrollDetection:
            shouldBypassTrollDetection.toString(),
      };
}

class CreatePostEvent extends CreatePostParentEvent {
  final Map<String, dynamic>? createPostInput;
  final List<int>? indices;
  List<Map<String, dynamic>>? postProperties;
  final List<double>? negativeConfidenceCounts;
  List<PostData>? processedPostData;
  final List<PostData> postDataList;
  final bool isPublic;
  final String commentScope;
  late final String? challengeId;

  void preparePostPropertiesFromProcessedPostData() {
    final List<Map<String, dynamic>> postProperties = [];
    for (final postData in postDataList) {
      if (postData is TextPostData) {
        postProperties.add({
          'textInput': postData.content,
        });
      } else if (postData is ImagePostData) {
        if (postData.croppedFile == null || postData.thumbFile == null) {
          continue;
        }
        final imageByteData = postData.croppedFile!.readAsBytesSync();
        final thumbByteData = postData.thumbFile!.readAsBytesSync();
        if (imageByteData.isEmpty || thumbByteData.isEmpty) {
          throw Exception('imageByteData is empty');
        }
        if (thumbByteData.isEmpty) {
          throw Exception('thumbByteData is empty');
        }
        final http.MultipartFile imageFile = http.MultipartFile.fromBytes(
          'image',
          imageByteData,
          filename: '${DateTime.now().second}.webp',
          contentType: http_parser.MediaType('image', 'webp'),
        );
        http.MultipartFile thumbFile;
        thumbFile = http.MultipartFile.fromBytes(
          'thumbnail',
          thumbByteData,
          filename: 'thumb_${DateTime.now().second}.webp',
          contentType: http_parser.MediaType('image', 'webp'),
        );
        postProperties.add({
          'imageInput': {
            'image': imageFile,
            'thumbnail': thumbFile,
          },
        });
      } else if (postData is StorageMediaPostData) {
        if (postData.assetEntity?.type == photo_manager.AssetType.image) {
          if (postData.compressedFile == null || postData.thumbFile == null) {
            continue;
          }
          final imageByteData = postData.compressedFile!.readAsBytesSync();
          final thumbByteData = postData.thumbFile!.readAsBytesSync();
          final http.MultipartFile imageFile = http.MultipartFile.fromBytes(
            'image',
            imageByteData,
            filename: '${DateTime.now().second}.webp',
            contentType: http_parser.MediaType('image', 'webp'),
          );
          http.MultipartFile thumbFile;
          thumbFile = http.MultipartFile.fromBytes(
            'thumbnail',
            thumbByteData,
            filename: 'thumb_${DateTime.now().second}.webp',
            contentType: http_parser.MediaType('image', 'webp'),
          );
          postProperties.add(
            {
              'imageInput': {
                'image': imageFile,
                'thumbnail': thumbFile,
              },
            },
          );
        } else {
          final byteData = postData.compressedFile!.readAsBytesSync();
          final multipartFile = http.MultipartFile.fromBytes(
            'video',
            byteData.buffer.asUint8List(),
            filename: '${DateTime.now().second}.mp4',
            contentType: http_parser.MediaType('video', 'mp4'),
          );
          final thumbByteData = postData.thumbFile!.readAsBytesSync();
          final thumbFile = http.MultipartFile.fromBytes(
            'thumbnail',
            thumbByteData.buffer.asUint8List(),
            filename: 'thumb_${DateTime.now().second}.jpg',
            contentType: http_parser.MediaType('image', 'jpg'),
          );
          postProperties.add(
            {
              'videoInput': {
                'video': multipartFile,
                'thumbnail': thumbFile,
              },
            },
          );
        }
      } else if (postData is VideoPostData) {
        final byteData = postData.compressedFile!.readAsBytesSync();
        final multipartFile = http.MultipartFile.fromBytes(
          'video',
          byteData.buffer.asUint8List(),
          filename: '${DateTime.now().second}.mp4',
          contentType: http_parser.MediaType('video', 'mp4'),
        );
        final thumbByteData = postData.thumbFile!.readAsBytesSync();
        final thumbFile = http.MultipartFile.fromBytes(
          'thumbnail',
          thumbByteData.buffer.asUint8List(),
          filename: 'thumb_${DateTime.now().second}.jpg',
          contentType: http_parser.MediaType('image', 'jpg'),
        );
        postProperties.add(
          {
            'videoInput': {
              'video': multipartFile,
              'thumbnail': thumbFile,
            },
          },
        );
      }
    }
    this.postProperties = postProperties;
  }

  CreatePostEvent({
    super.captionBody,
    required super.captionData,
    required super.createPostGxC,
    required PostSettingsGxC postSettingsGxC,
    super.shouldBypassTrollDetection,
    this.createPostInput,
    this.indices,
    this.negativeConfidenceCounts,
    this.processedPostData,
  })  : isPublic = createPostGxC.isPublic,
        postDataList = createPostGxC.posts,
        commentScope = createPostGxC.commentScope.name,
        super(
          postSettingsGxC: postSettingsGxC,
          negativeIndices: indices,
          negativeResults: negativeConfidenceCounts,
        ) {
    if (postSettingsGxC.selectedChallenge.value.id.isNotEmpty && !isStory) {
      challengeId = postSettingsGxC.selectedChallenge.value.id;
    } else {
      challengeId = null;
    }
  }

  @override
  Map<String, dynamic> getAnalyticParameters() {
    int textPostCount = 0;
    int imagePostCount = 0;
    int videoPostCount = 0;
    for (int i = 0; i < postDataList.length; i++) {
      final PostData postData = postDataList[i];
      if (postData is TextPostData) {
        textPostCount++;
      } else if (postData is ImagePostData) {
        imagePostCount++;
      } else if (postData is VideoPostData) {
        videoPostCount++;
      }
    }
    final params = super.getAnalyticParameters();
    params[AnalyticsParameters.kTextPostCount] = textPostCount;
    params[AnalyticsParameters.kImagePostCount] = imagePostCount;
    params[AnalyticsParameters.kVideoPostCount] = videoPostCount;
    return params;
  }

  Map<String, dynamic> getInput() {
    preparePostPropertiesFromProcessedPostData();
    Map<String, dynamic> createPostInputData;
    if (createPostInput == null) {
      // debugPrint('data-->$postProperties');
      final String visibility = isPublic ? 'ALL' : 'FOLLOWERS';
      createPostInputData = {
        'caption': SmartTextCommon().createContentForSubmission(
          captionData,
          body: captionBody,
          shouldAddContentKey: false,
        ),
        'visibility': visibility,
        'properties': postProperties,
        'commenterScope': commentScope,
      };
      if (isStory) {
        createPostInputData['expirationHourCount'] = 24;
      }
      if (shouldBypassTrollDetection) {
        createPostInputData['shouldBypassTrollDetection'] = true;
        createPostInputData['negativeIndices'] = indices;
        createPostInputData['negativeResults'] = negativeConfidenceCounts;
      }
    } else {
      createPostInputData = createPostInput!;
      createPostInputData['shouldBypassTrollDetection'] = true;
      createPostInputData['negativeIndices'] = indices;
      createPostInputData['negativeResults'] = negativeConfidenceCounts;
    }
    if (challengeId != null) {
      createPostInputData['challengeId'] = challengeId;
    }
    createPostInputData['accessControl'] = postAccessControlRequestVariables();
    return {'createMultiPostInput': createPostInputData};
  }
}

class GetPostPinnedCommentEvent extends MainBlocEvent {
  final String postId;

  GetPostPinnedCommentEvent({required this.postId});

  Map<String, dynamic> getInput() => {'postId': postId};
}

class CheckTextPostTroll extends MainBlocEvent {
  final String textPostContent;

  const CheckTextPostTroll({
    required this.textPostContent,
  });

  Future<Map<String, dynamic>> getInput() async => {
        'input': {'content': textPostContent},
      };
}
