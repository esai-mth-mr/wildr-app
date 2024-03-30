import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';

class RepostEvent extends CreatePostParentEvent {
  final String parentPostId;

  RepostEvent({
    required this.parentPostId,
    super.captionBody,
    required super.captionData,
    required super.createPostGxC,
    required super.postSettingsGxC,
    super.shouldBypassTrollDetection,
    super.negativeIndices,
    super.negativeResults,
  });

  @override
  Map<String, dynamic> getAnalyticParameters() {
    final params = super.getAnalyticParameters();
    params[AnalyticsParameters.kParentPostId] = parentPostId;
    return params;
  }
}

class PaginateRepostedPostsEvent extends MainBlocEvent {
  final String? after;
  final String? postId;

  PaginateRepostedPostsEvent(this.postId, {this.after});

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kParentPostId: postId,
    };

  Map<String, dynamic> getVariables() => {
      'getPostInput': {'id': postId},
      'repostedPostsPaginationInput': {'take': 10, 'after': after},
    };

  String operationName() => 'getPost';

  String query() => r'''
query getPost(
  $getPostInput: GetPostInput!
  $repostedPostsPaginationInput: PaginationInput
) {
  getPost(input: $getPostInput) {
    ... on GetPostResult {
      post {
        __typename
        willBeDeleted
        baseType
        isPrivate
        author {
          ...AuthorFragment
        }
        repostAccessControlContext {
          __typename
          cannotRepostErrorMessage
          canRepost
          hasReposted
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
        ts {
          createdAt
          updatedAt
          expiry
        }
        postContext {
          liked
          realed
          applauded
        }
        ... on MultiMediaPost {
          id
          caption {
            ...ContentFragment
          }
          ...MultiPostProperties
          repostMeta(
            repostedPostsPaginationInput: $repostedPostsPaginationInput
          ) {
            count
            parentPost {
              id
              baseType
              author {
                handle
              }
            }
            repostedPosts {
              pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
                pageNumber
              }
              edges {
                __typename
                cursor
                node {
                  __typename
                  id
                  author {
                    id
                    handle
                  }
                  ... on MultiMediaPost {
                    caption {
                      ...ContentFragment
                    }
                  }
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

fragment MultiPostProperties on MultiMediaPost {
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
      lang {
        __typename
        code
      }
    }
    ... on Tag {
      id
      name
    }
    ... on User {
      id
      handle
    }
  }
}

    
    ''';
}
