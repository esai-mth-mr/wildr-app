import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

class PostQueries {
  String get getPostPinnedCommentOperationName => 'getPinnedComment';

  static const String _getPostPinnedCommentQuery = r'''
query getPinnedComment($postId: ID!) {
  getPost(input: { id: $postId }) {
    ...on SmartError {
      __typename
      message
    }
    ... on GetPostResult {
      __typename
      post {
        __typename
        id
        pinnedComment {
          __typename
          ...CommentFragment
        }
      }
    }
  }
}
  ''';

  String get getPostPinnedCommentQuery =>
      CreateQuery.createQuery(_getPostPinnedCommentQuery, [
        GFragments.kCommentWithoutContextFragment,
        GFragments.kContentFragment,
        GFragments.kUserFragment,
        GFragments.kTimestampFragment,
        GFragments.kUserContextFragment,
      ]);

  String get getCreatePostMutation => r'''
fragment UserFragment on User {
  __typename
  id
  handle
  name
  avatarImage {
    __typename
    uri
  }
  realIdVerificationStatus
  stats {
    __typename
    followingCount
    followerCount
    postCount
    innerCircleCount
  }
  isSuspended
  score
  strikeData {
    __typename
    isFaded
    currentStrikeCount
  }
}


fragment ImageFragment on Image {
  __typename
  id
  source {
    __typename
    uri
  }
  type
}

fragment MediaSourceFragment on MediaSource {
  __typename
  uri
}

fragment VideoFragment on Video {
  __typename
  id
  source {
    __typename
    ...MediaSourceFragment
  }
  type
}

fragment PostStatsFragment on PostStats {
  __typename
  likeCount
  shareCount
  repostCount
  commentCount
  reportCount
}

fragment ContentFragment on Content {
  body
  segments {
    __typename
    ... on Text {
      __typename
      chunk
      noSpace
      lang {
        __typename
        code
      }
    }
    ... on Tag {
      __typename
      id
      name
      noSpace
    }
    ... on User {
      __typename
      id
      handle
    }
  }
}

fragment PostContextFragment on PostContext {
  __typename
  liked
}

fragment TimestampFragment on Timestamps {
    __typename
    createdAt
    expiry
}

fragment MultiMediaPostFragment on MultiMediaPost {
  __typename
  id
  willBeDeleted
  sensitiveStatus
  isPrivate
  author {
    __typename
    ...UserFragment
  }
  stats {
    __typename
    ...PostStatsFragment
  }
  ts {
    __typename
    ...TimestampFragment
  }
  postContext {
    __typename
    ...PostContextFragment
  }
  thumbnail {
    __typename
    ...ImageFragment
  }
  caption {
    __typename
    ...ContentFragment
  }
  properties {
  __typename
    ... on TextPostProperties {
      __typename
      content {
        __typename
        ...ContentFragment
      }
    }
    ... on ImagePostProperties {
      __typename
      image {
        __typename
        ...ImageFragment
      }
      thumbnail {
        __typename
        ...ImageFragment
      }
    }
    ... on VideoPostProperties {
      __typename
      video {
        __typename
        ...VideoFragment
      }
      thumbnail {
        __typename
        ...ImageFragment
      }
    }
  }
  accessControl {
    __typename
    postVisibility
    commentVisibilityAccess
    commentPostingAccess
  }  
}

fragment PostDetailsFragment on Post {
  __typename
  ... on MultiMediaPost {
    __typename
    ...MultiMediaPostFragment
  }
}

mutation createMultiMediaPost(
  $createMultiPostInput: CreateMultiMediaPostInput!
) {
  createMultiMediaPost(input: $createMultiPostInput) {
    ... on CreatePostResult {
      post {
        __typename
        ...PostDetailsFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
    ... on TrollDetectorError {
      __typename
      message
      data
      indices
      results
    }
  }
}
    
    ''';
}
