class ChallengeFragments {
  static const String kCover = r'''
fragment ImageFragment on Image {
  __typename
  id
  source {
    __typename
    uri
  }
  type
}

fragment ChallengeCover on ChallengeCover {
  __typename
  coverImage {
    __typename
    image {
      ...ImageFragment
    }
    thumbnail {
      ...ImageFragment
    }
  }
  coverImageEnum
}
''';

  static const String kAuthor = r'''
fragment AuthorFragment on User {
  __typename
  id
  handle
  name
  avatarImage {
    __typename
    uri
  }
  score
  currentUserContext {
    __typename
    followingUser
    isInnerCircle
  }
  isSuspended
  strikeData {
    __typename
    isFaded
    currentStrikeCount
  }
}

''';

  static const String kTimeStamps = r'''
fragment ChallengeTimestamps on Timestamps {
  __typename
  createdAt
  updatedAt
  start
  expiry
}
''';

  static const String kStats = r'''
fragment ChallengeStatsFragment on ChallengeStats {
  __typename
  entryCount
  participantCount
  commentCount
  shareCount
  reportCount
}  
  ''';

  static const String kChallenge = r'''
fragment ChallengeFragment on Challenge {
  __typename
  id
  name
  author {
    ...AuthorFragment
  }
  cover {
    ...ChallengeCover
  }
  ts {
    ...ChallengeTimestamps
  }
  isCompleted
}
''';

  static const String kChallengeDetails = r'''
fragment ChallengeFragment on Challenge {
  __typename
  id
  name
  author {
    __typename
    ...AuthorFragment
  }
  cover {
    __typename
    ...ChallengeCover
  }
  ts {
    __typename
    ...ChallengeTimestamps
  }
  stats {
    __typename
    ...ChallengeStatsFragment
  }
  description {
    __typename
    ...ContentFragment
  }
  previewParticipants {
    __typename
    displayText
    participants {
      __typename
      id
      handle
      avatarImage {
        __typename
        uri
      }
    }
  }
  isOwner
  currentUserContext {
    __typename
    isOwner
    hasJoined
  }
  authorInteractionsConnection() {
    __typename
    interactionCount
  }
  isCompleted
}
''';

  static const String kChallengeWithPreviewParticipants = r'''
fragment ChallengeFragment on Challenge {
  __typename
  id
  name
  previewParticipants {
    __typename
    displayText
    participants {
      __typename
      id
      handle
      avatarImage {
        __typename
        uri
      }
    }
  }
  currentUserContext {
    __typename
    hasJoined
  }
  author {
    __typename
    ...AuthorFragment
  }
  cover {
    __typename
    ...ChallengeCover
  }
  ts {
    __typename
    ...ChallengeTimestamps
  }
  isCompleted
}
''';

  static const String kEntriesConnection = r'''
fragment ChallengeEntriesConnection on ChallengeEntriesConnection {
  __typename
  targetEntryError
  pageInfo {
    __typename
    ...PageInfoFragment
  }
  userToSearchForId
  edges {
    __typename
    cursor
    node {
      __typename
      id
      ...on MultiMediaPost {
        __typename
        ...MultiMediaPostFragment
      }
    }
  }
}
''';

  static const String kParticipantPost = r'''
fragment ParticipantPost on Post {
  __typename
  id
  baseType
  ... on MultiMediaPost {
    __typename
    id
    isHiddenOnChallenge
    willBeDeleted
    sensitiveStatus
    isPrivate
    baseType
    properties {
      __typename
      ... on TextPostProperties {
        __typename
        content {
          __typename
          body
        }
      }
      ... on ImagePostProperties {
        __typename
        thumbnail {
          __typename
          source {
            __typename
            uri
          }
        }
      }
      ... on VideoPostProperties {
        __typename
        thumbnail {
          __typename
          source {
            __typename
            uri
          }
        }
      }
    }
  }
}  
  ''';

  static const String kParticipant = r'''
fragment ChallengeParticipantFragment on ChallengeParticipant {
  __typename
  isCreator
  isFriend
  entryCount
  user {
    __typename
    ...AuthorFragment
  }
  post {
    __typename
    ...ParticipantPost
  }
}
  ''';

  static const String kParticipantsConnection = r'''
fragment ParticipantsConnection on ChallengeParticipantsConnection {
  __typename
  pageInfo {
    ...PageInfoFragment
  }
  edges {
    __typename
    cursor
    node {
      ...ChallengeParticipantFragment
    }
  }
}
  ''';

  static const String kLeaderboardConnection = r'''
fragment LeaderboardConnection on ChallengeLeaderboardConnection {
  __typename
  pageInfo {
    ...PageInfoFragment
  }
  edges {
    __typename
    cursor
    node {
      __typename
      ...ChallengeParticipantFragment
    }
  }
}
  ''';

  static const String kCommentFragment = r'''
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
    ...AuthorFragment
  }
  body {
    __typename
    ...ContentFragment
  }
  commentStats {
    __typename
    likeCount
    replyCount
    reportCount
  }
  participationType
}
  ''';

  static const String kCommentsConnection = r'''
fragment ChallengeCommentsConnection on ChallengeCommentsConnection {
  __typename
  targetCommentError
  pageInfo {
    __typename
    ...PageInfoFragment
  }
  edges {
    __typename
    cursor
    node {
      __typename
      ...CommentFragment
    }
  }
}  
  ''';

  static const String kChallengeCommentsConnection = r'''
fragment ChallengeCommentsConnection on ChallengeCommentsConnection {
  __typename
  targetCommentError
  pageInfo {
    __typename
    ...PageInfoFragment
  }
  edges {
    __typename
    cursor
    node {
      __typename
      ...CommentFragment
    }
  }
}  
  ''';
}
