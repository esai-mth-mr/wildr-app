import autocannon from 'autocannon';

const query = /* GraphQL */ `
  fragment PageInfoFragment on PageInfo {
    startCursor
    endCursor
    hasNextPage
    hasPreviousPage
    pageNumber
    count
    totalCount
  }

  fragment CommentFragment on Comment {
    id
    ts {
      createdAt
      updatedAt
    }
    author {
      ...UserFragment
    }
    body {
      body
      ...ContentFragment
    }
    commentStats {
      likeCount
      replyCount
    }
    commentContext {
      liked
    }
    participationType
  }

  fragment UserFragment on User {
    id
    score
    isAvailable
    isSuspended
    handle
    name
    avatarImage {
      uri
    }
    strikeData {
      isFaded
      currentStrikeCount
    }
  }

  fragment PostStatsFragment on PostStats {
    likeCount
    applauseCount
    realCount
    shareCount
    repostCount
    commentCount
  }

  fragment TimestampFragment on Timestamps {
    __typename
    createdAt
    updatedAt
    expiry
  }

  fragment PostContextFragment on PostContext {
    liked
  }

  fragment MediaSourceFragment on MediaSource {
    uri
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

  fragment VideoFragment on Video {
    id
    source {
      ...MediaSourceFragment
    }
    type
  }

  fragment ImageFragment on Image {
    id
    source {
      uri
    }
    type
  }

  fragment MultiMediaPostFragment on MultiMediaPost {
    __typename
    id
    willBeDeleted
    sensitiveStatus
    isPinnedToChallenge
    isHiddenOnChallenge
    isPrivate
    author {
      ...UserFragment
    }
    stats {
      ...PostStatsFragment
    }
    ts {
      ...TimestampFragment
    }
    pinnedComment {
      ...CommentFragment
    }
    postContext {
      ...PostContextFragment
    }
    thumbnail {
      ...ImageFragment
    }
    caption {
      ...ContentFragment
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
          ...ImageFragment
        }
        thumbnail {
          ...ImageFragment
        }
      }
      ... on VideoPostProperties {
        __typename
        video {
          ...VideoFragment
        }
        thumbnail {
          ...ImageFragment
        }
      }
    }
    accessControl {
      postVisibility
      commentVisibilityAccess
      commentPostingAccess
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
  }

  fragment ChallengeCurrentEntriesProgressConnection on ChallengeEntriesConnection {
    __typename
    pageInfo {
      ...PageInfoFragment
    }
    targetEntryError
    edges {
      __typename
      cursor
      node {
        id
        ... on MultiMediaPost {
          ...MultiMediaPostFragment
        }
      }
    }
  }

  query getChallenge($challengeId: ID!, $paginationInput: PaginationInput!) {
    getChallenge(input: { id: $challengeId }) {
      ... on GetChallengeResult {
        __typename
        challenge {
          id
          name
          allEntriesConnection(
            challengeId: $challengeId
            paginationInput: $paginationInput
          ) {
            ...ChallengeCurrentEntriesProgressConnection
          }
          isCompleted
        }
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
`;

const CHALLENGE_ID = 'KrJNOZmQDRIcNglu';

async function main() {
  const result = await autocannon({
    url: 'http://wildr-dev-2.us-west-2.elasticbeanstalk.com/graphql',
    connections: 100,
    duration: 240,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query,
      variables: {
        challengeId: CHALLENGE_ID,
        paginationInput: {
          take: 10,
        },
      },
    }),
    overallRate: 15,
  });
  console.log(result);
}

// Maxing out at about 15 requests per second on the dev server.
// DB load at 15% rising from 10%.
// CPU load at 40%.

main();
