class GFragments {
  static const kCompanyDetails = r'''
  fragment companyDetails on Company {
    __typename
    id
    name
    description
    users {
      __typename
      firstName
    }
  }
    ''';

  static const kCommentPostingAccessControlContextFragment = r'''
fragment CommentPostingAccessControlContextFragment on CommentPostingAccessControlContext {
  __typename
  commentPostingAccess
  canComment
  cannotCommentErrorMessage
}  
  ''';

  static const kCommentVisibilityAccessControlContextFragment = r'''
fragment CommentVisibilityAccessControlContextFragment on CommentVisibilityAccessControlContext {
  __typename
  cannotViewCommentErrorMessage
  canViewComment
  commentVisibilityAccess
}
  ''';

  static const kPostStatsFragment = r'''
  fragment PostStatsFragment on PostStats {
    __typename
    likeCount
    applauseCount
    realCount
    shareCount
    repostCount
    commentCount
  }
    ''';

  static const kUserContextFragment = r'''
  fragment UserContextFragment on UserContext {
    __typename
    followingUser
    isInnerCircle
  }
    ''';

  static const kPostContextFragment = r'''
  fragment PostContextFragment on PostContext {
    __typename
    liked
  }
  ''';

  static const kTimestampFragment = r'''
  fragment TimestampFragment on Timestamps {
    __typename
    createdAt
    updatedAt
    expiry
  }
  ''';

  static const kTagFragment = r'''
  fragment TagFragment on Tag {
    __typename
    id
    name
  }
  ''';

  static const kUserFragment = r'''
  fragment UserFragment on User {
    __typename
    id
    score
    isAvailable
    isSuspended
    hasBlocked
    ts {
      __typename
      ...TimestampFragment
    }
    handle
    name
    email
    avatarImage {
      __typename
      uri
    }
    stats {
      __typename
      followingCount
      followerCount
      postCount
    }
    currentUserContext {
      __typename
      ...UserContextFragment
    }
    strikeData {
      __typename
      isFaded
      currentStrikeCount
    }
  }
  ''';

  static const kUserFragmentGetFeed = r'''
  fragment UserFragment on User {
    __typename
    id
    score
    isAvailable
    isSuspended
    handle
    name
    avatarImage {
      __typename
      uri
    }
    strikeData {
      __typename
      isFaded
      currentStrikeCount
    }
  }
  ''';

  static const kUserFragmentWithoutContextAndStats = r'''
  fragment UserFragment on User {
    __typename
    id
    score
    isAvailable
    isSuspended
    handle
    name
    avatarImage {
      __typename
      uri
    }
    strikeData {
      __typename
      isFaded
      currentStrikeCount
    }
  }
  ''';

  static const kUserFragmentWithoutContext = r'''
  fragment UserFragment on User {
    __typename
    id
    score
    isAvailable
    isSuspended
    handle
    name
    avatarImage {
      __typename
      uri
    }
    stats {
      __typename
      followingCount
      followerCount
      postCount
    }
    strikeData {
      __typename
      isFaded
      currentStrikeCount
    }
  }
  ''';

  static const kCurrentUserFragment = r'''
fragment CurrentUserFragment on User {
  __typename
  id
  ts {
    __typename
    ...TimestampFragment
  }
  handle
  name
  isSuspended
  email
  phoneNumber
  avatarImage {
    __typename
    uri
  }
  stats {
    __typename
    followingCount
    followerCount
    postCount
  }
  strikeData {
    __typename
    isFaded
    currentStrikeCount
    firstStrikeCount
    firstStrikeTS
    firstStrikeExpiryTS
    secondStrikeCount
    secondStrikeTS
    secondStrikeExpiryTS
    thirdStrikeCount
    thirdStrikeTS
    thirdStrikeExpiryTS
    fadeStrikeCount
    fadeStrikeTimeStamps
  }
  currentUserContext {
    __typename
    ...UserContextFragment
  }
}
  ''';

  static const kReplyFragment = r'''
  fragment ReplyFragment on Reply {
    __typename
    id
    ts {
      __typename
      createdAt
      updatedAt
    }
    author {
      __typename
      ...UserFragment
    }
    body {
      __typename
      body
      ...ContentFragment
    }
    replyStats {
      __typename
      likeCount
    }
    replyContext {
      __typename
      liked
    }
  }
  ''';

  static const kCommentFragment = r'''
  fragment CommentFragment on Comment {
    __typename
    id
    ts {
      __typename
      createdAt
      updatedAt
    }
    author {
      __typename
      ...UserFragment
    }
    body {
      __typename
      body
      ...ContentFragment
    }
    commentStats {
      __typename
      likeCount
      replyCount
    }
    commentContext {
      __typename
      liked
    }
    participationType
  }  
  ''';

  static const kCommentWithoutContextFragment = r'''
  fragment CommentFragment on Comment {
    __typename
    id
    ts {
      __typename
      createdAt
      updatedAt
    }
    author {
      __typename
      ...UserFragment
    }
    body {
      __typename
      body
      ...ContentFragment
    }
    commentStats {
      __typename
      likeCount
      replyCount
    }
    participationType
  }  
  ''';

  static const kPostFragment = r'''
  fragment PostFragment on Post {
    __typename
    id
    author {
      __typename
      ...UserFragment
    }
    stats {
      __typename
      ...PostStatsFragment
    }
    tags {
      __typename
      ...TagFragment
    }
    ts {
      __typename
      ...TimestampFragment
    }
    pinnedComment {
    __typename
    ...CommentFragment
    }
  }
  ''';

  static const kLanguageFragment = r'''
  fragment LanguageFragment on Language {
    __typename
    code
  }
    
    ''';

  static const kContentFragment = r'''
  fragment ContentFragment on Content {
    __typename
    body,
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
    ''';

  static const kMultiMediaPostFragment = r'''
  fragment MultiMediaPostFragment on MultiMediaPost {
    __typename
    id
    stats {
      __typename
      likeCount
      realCount
      applauseCount
      shareCount
      repostCount
      commentCount
      reportCount
    }
    baseType
    willBeDeleted
    sensitiveStatus
    isPrivate
    isPinnedToChallenge
    isHiddenOnChallenge
    author {
      __typename
      ...UserFragment
    }
    stats {
      __typename
      ...PostStatsFragment
    }
    tags {
      __typename
      ...TagFragment
    }
    ts {
      __typename
      ...TimestampFragment
    }
    pinnedComment {
      __typename
      ...CommentFragment
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
      ...on TextPostProperties {
        __typename
        content {
          __typename
          ...ContentFragment
        }
      }
      ...on ImagePostProperties {
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
      ...on VideoPostProperties {
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
    repostAccessControlContext {
      __typename
      cannotRepostErrorMessage
      canRepost
      hasReposted
    }
    baseType
    repostMeta {
      __typename
      count
      isParentPostDeleted
      parentPost {
        __typename
        id
        author {
          __typename
          id
          handle
          score
          avatarImage {
            __typename
            uri
          }
        }
      }
    }  
    parentChallenge {
      __typename
      id
      name
      isOwner
      currentUserContext {
        __typename
        hasJoined
      }
    }
  }
  ''';

  static const kTextPostFragment = r'''
  fragment TextPostFragment on TextPost {
    __typename
    id
    author {
      __typename
      ...UserFragment
    }
    stats {
      __typename
      ...PostStatsFragment
    }
    tags {
      __typename
      ...TagFragment
    }
    ts {
      __typename
      ...TimestampFragment
    }
    pinnedComment {
      __typename
      ...CommentFragment
    }
    postContext {
      __typename
      ...PostContextFragment
    }
    content {
      __typename
      ...ContentFragment
    }
  }
    ''';

  static const kImageFragment = r'''
  fragment ImageFragment on Image {
    __typename
    id
    source {
      __typename
      uri
    }
    type
  }  
    ''';

  static const kImagePostFragment = r'''
fragment ImagePostFragment on ImagePost {
  __typename
  id
  author {
    __typename
    ...UserFragment
  }
  stats {
    __typename
    ...PostStatsFragment
  }
  tags {
    __typename
    ...TagFragment
  }
  ts {
    __typename
    ...TimestampFragment
  }
  pinnedComment {
    __typename
    ...CommentFragment
  }
  postContext {
    __typename
    ...PostContextFragment
  }
  tags {
    __typename
    ...TagFragment
  }
  image {
    __typename
    ...ImageFragment
  }
  thumbnail {
    __typename
    ...ImageFragment
  }
  caption {
    __typename
    ...ContentFragment
  } 
}
    ''';

  static const kMediaSourceFragment = r'''
  fragment MediaSourceFragment on MediaSource {
    __typename
    uri
  }
    
    ''';

  static const kVideoFragment = r'''
  fragment VideoFragment on Video {
    __typename
    id
    source {
      __typename
      ...MediaSourceFragment
    }
    type
  }  
    ''';

  static const kVideoPostFragment = r'''
fragment VideoPostFragment on VideoPost {
  __typename
  id
  author {
    __typename
    ...UserFragment
  }
  stats {
    __typename
    ...PostStatsFragment
  }
  tags {
    __typename
    ...TagFragment
  }
  ts {
    __typename
    ...TimestampFragment
  }
  pinnedComment {
    __typename
    ...CommentFragment
  }  
  postContext {
    __typename
    ...PostContextFragment
  }
  stats {
    __typename
    ...PostStatsFragment
  }
  tags {
    __typename
    ...TagFragment
  }
  caption {
    __typename
    ...ContentFragment
  }
  video {
    __typename
    ...VideoFragment
  }
  thumbnail {
    __typename
    ...ImageFragment
  }
}
    ''';

  static const kAudioFragment = r'''
  fragment AudioFragment on Audio {
    __typename
    id
    source {
      __typename
      ...MediaSourceFragment
    }
  }
    ''';

  static const kAudioPostFragment = r'''
fragment AudioPostFragment on AudioPost {
  __typename
  ...PostFragment
  author {
    __typename
    ...UserFragment
  }
  postContext {
    __typename
    ...PostContextFragment
  }
  stats {
    __typename
    ...PostStatsFragment
  }
  tags {
    __typename
    ...TagFragment
  }
  caption {
    __typename
    ...ContentFragment
  }
  audio {
    __typename
    ...AudioFragment
  }
  coverImage {
    __typename
    ...ImageFragment
  }
  pinnedComment {
    __typename
    ...CommentFragment
  }
}
    ''';

  static const kPostDetailsFragment = r'''
    fragment PostDetailsFragment on Post {
      __typename
      ... on TextPost {
        __typename
        ...TextPostFragment
      }
      ... on ImagePost {
        __typename
        ...ImagePostFragment
      }
      ... on VideoPost {
        __typename
        ...VideoPostFragment
      }
    }
    ''';

  static const kPageInfoFragment = r'''
  fragment PageInfoFragment on PageInfo {
    __typename
    startCursor
    endCursor
    hasNextPage
    hasPreviousPage
    pageNumber
    count
    totalCount
  }  
    ''';

  static const kPostCommentsEdgeFragment = r'''
  fragment PostCommentsEdgeFragment on PostCommentsEdge {
    __typename
    cursor
    node {
      __typename
      ...CommentFragment
    }
  }
  ''';

  static const kCommentRepliesEdgeFragment = r'''
  fragment CommentRepliesEdgeFragment on CommentRepliesEdge {
    __typename
    cursor
    node {
      __typename
      ...ReplyFragment
    }
  }
  ''';

  static const kFeedPostsEdgeFragment = r'''
fragment FeedPostsEdgeFragment on FeedPostsEdge {
  cursor
  node {
    __typename
    id
    stats {
      __typename
      likeCount
      realCount
      applauseCount
      shareCount
      repostCount
      commentCount
      reportCount
    }
    ... on TextPost {
      __typename
      ...TextPostFragment
    }
    ... on ImagePost {
      __typename
      ...ImagePostFragment
    }
    ... on VideoPost {
      __typename
      ...VideoPostFragment
    }
    ...on MultiMediaPost {
      __typename
      ...MultiMediaPostFragment
    }
  }
}
  ''';

  static const kPaginatedFeedFragment = r'''
  fragment PaginatedFeedFragment on Feed {
    __typename
    id
    ts {
      __typename
      ...TimestampFragment
    }
  }
  ''';

  static const kPaginatedRepliesOutput = r'''
fragment PaginatedRepliesOutput on GetCommentResult {
  comment {
    __typename
    id
    ts {
      __typename
      ...TimestampFragment
    }
    author {
      __typename
      ...UserFragment
    }
    body {
      __typename
      ...ContentFragment
    }
    replyStats {
      __typename
      likeCount
    }
    replyContext {
      __typename
      liked
    }
    repliesConnection(
      commentId: $commentId
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      pageInfo {
        __typename
        ...PageInfoFragment
      }
      edges {
        __typename
        ...CommentRepliesEdgeFragment
      }
    }
    participationType
  }
}
  ''';

  static const kPaginatedCommentsOutput = r'''
fragment PaginatedCommentsOutput on GetPostResult {
  post {
    __typename
    ...PostDetailsFragment
    commentsConnection(
      postId: $postId
      first: $first
      after: $after
      last: $last
      before: $before
      targetCommentId: $targetCommentId
    ) {
      pageInfo {
        __typename
        ...PageInfoFragment
      }
      edges {
        __typename
        ...PostCommentsEdgeFragment
      }
    }
  }
}
  ''';

  static const kPaginatedFeedOutput = r'''
fragment PaginatedFeedOutput on GetFeedResult {
  feed {
    ...PaginatedFeedFragment
    postsConnection(
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      pageInfo {
        __typename
        ...PageInfoFragment
      }
      edges {
        __typename
        ...FeedPostsEdgeFragment
      }
    }
  }
}
 
  ''';

  static const kReactorsListEdgeFragment = r'''
fragment ReactorsListEdgeFragment on UsersListEdge {
  cursor
  node {
    __typename
    id
    handle
    name
    avatarImage {
      __typename
      uri
    }
    score
    strikeData {
      __typename
      isFaded
      currentStrikeCount
      }
    }
}
''';

  static const kReactorsUserListConnectionFragment = r'''
fragment ReactorsUserListConnectionFragment on PostReactorsListConnection {
  __typename
  pageInfo {
    __typename
    ...PageInfoFragment
  }
  count
  edges {
    __typename
    ...ReactorsListEdgeFragment
  }
}
''';

  static List<String> postDetailsFragment = [
    //GFragments.kAudioFragment,
    GFragments.kMediaSourceFragment,
    GFragments.kVideoFragment,
    GFragments.kImageFragment,
    GFragments.kTimestampFragment,
    GFragments.kContentFragment,
    GFragments.kTagFragment,
    GFragments.kPostStatsFragment,
    GFragments.kUserContextFragment,
    GFragments.kCommentFragment,
    GFragments.kUserFragment,
    //GFragments.kPostFragment,
    GFragments.kTextPostFragment,
    GFragments.kImagePostFragment,
    GFragments.kVideoPostFragment,
    GFragments.kPostDetailsFragment,
  ];
}
