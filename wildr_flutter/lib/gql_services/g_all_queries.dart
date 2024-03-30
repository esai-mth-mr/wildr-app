class GAllQueries {
  static String allQueries() => r'''
    
fragment PostStatsFragment on PostStats {
  __typename
  likeCount
  realCount
  applauseCount
  shareCount
  repostCount
  commentCount
  reportCount
}

fragment UserContextFragment on UserContext {
  __typename
  followingUser
}

fragment PostContextFragment on PostContext {
  __typename
  liked
  realed
  applauded
}

fragment TimestampFragment on Timestamps {
  __typename
  createdAt
  updatedAt
  expiry
}

fragment TagFragment on Tag {
  __typename
  id
  name
}

fragment CurrentUserFragment on User {
  __typename
  id
  ts {
    __typename
    ...TimestampFragment
  }
  handle
  name
  email
  phoneNumber
  commentEnabledAt
  commentOnboardedAt
  userCreatedAt
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
  score
  isSuspended
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
  }
  realIdVerificationStatus
  realIdFace {
    __typename
    uri
  }
  currentUserContext {
    __typename
    ...UserContextFragment
  }
}

fragment UserFragment on User {
  __typename
  id
  ts {
    __typename
    ...TimestampFragment
  }
  handle
  name
  email
  phoneNumber
  commentEnabledAt
  commentOnboardedAt
  userCreatedAt
  avatarImage {
    __typename
    uri
  }
  hasPersonalizedFeed
  realIdVerificationStatus
  realIdFace {
    __typename
    uri
  }
  isSuspended
  score
  strikeData {
    __typename
    isFaded
    currentStrikeCount
  }
}

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
}

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

fragment PostFragment on Post {
  __typename
  id
  author {
    __typename
    ...UserFragment
  }
  ts {
    __typename
    ...TimestampFragment
  }
  stats {
    __typename
    ...PostStatsFragment
  }
  tags {
    __typename
    ...TagFragment
  }
}

fragment ContentFragmentJustBody on Content {
  __typename
  body
}

fragment ContentFragment on Content {
  __typename
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

fragment TextPostFragment on TextPost {
  __typename
  id
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
  content {
    __typename
    ...ContentFragment
  }
  pinnedComment {
    __typename
    ...CommentFragment
  }
  ts {
    __typename
    ...TimestampFragment
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

fragment ImagePostFragment on ImagePost {
  __typename
  id
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
  pinnedComment {
    __typename
    ...CommentFragment
  }
  ts {
    __typename
    ...TimestampFragment
  }
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
  ... on MultiMediaPost {
    __typename
    ...MultiMediaPostFragment
  }
}

fragment MediaSourceFragment on MediaSource {
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

fragment VideoPostFragment on VideoPost {
  id
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
  video {
    __typename
    ...VideoFragment
  }
  thumbnail {
    __typename
    ...ImageFragment
  }
  pinnedComment {
    __typename
    ...CommentFragment
  }
  ts {
    __typename
    ...TimestampFragment
  }
}

fragment PageInfoFragment on PageInfo {
  __typename
  startCursor
  endCursor
  hasNextPage
  hasPreviousPage
  pageNumber
}

fragment PostCommentsEdgeFragment on PostCommentsEdge {
  __typename
  cursor
  node {
    __typename
    ...CommentFragment
  }
}

fragment CommentRepliesEdgeFragment on CommentRepliesEdge {
  __typename
  cursor
  node {
    __typename
    ...ReplyFragment
  }
}

fragment FeedPostsEdgeFragment on FeedPostsEdge {
  __typename
  cursor
  node {
    __typename
    id
    key: id
    ...PostDetailsFragment
  }
}

mutation createMultiMediaPost(
  $createMultiPostInput: CreateMultiMediaPostInput!
) {
  createMultiMediaPost(input: $createMultiPostInput) {
        __typename
        ... on CreatePostResult {
          __typename
          post {
            __typename
            ...PostDetailsFragment
          }
        }
        ... on SmartError {
          __typename
          message
        }
        ... on  TrollDetectorError {
          __typename
          message
          data
          indices
          results
        }
  }
}

mutation createTextPost($createTextPost: CreateTextPostInput!) {
  createTextPost(input: $createTextPost) {
    __typename
    ... on CreatePostResult {
      __typename
      post {
        __typename
        ... on TextPost {
          __typename
          ...TextPostFragment
        }
      }
    }
  }
}

mutation createImagePost($createImagePost: CreateImagePostInput!) {
  createImagePost(input: $createImagePost) {
    ... on CreatePostResult {
      __typename
      post {
        __typename
        ... on ImagePost {
          __typename
          ...ImagePostFragment
        }
      }
    }
  }
}

mutation createVideoPost($createVideoPost: CreateVideoPostInput!) {
  createVideoPost(input: $createVideoPost) {
    ... on CreatePostResult {
      __typename
      post {
        __typename
        ... on VideoPost {
          __typename
          ...VideoPostFragment
        }
      }
    }
  }
}

fragment PaginatedFeedFragment on Feed {
  __typename
  id
  ts {
    __typename
    ...TimestampFragment
  }
}

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
    body {
      __typename
      ...ContentFragment
    }
    commentStats {
      __typename
      likeCount
    }
    commentContext {
      __typename
      liked
    }
    repliesConnection(
      commentId: $commentId
      first: $first
      after: $after
      last: $last
      before: $before
      includingAndAfter: $includingAndAfter
      includingAndBefore: $includingAndBefore
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

fragment PaginatedCommentsOutput on GetPostResult {
  __typename
  post {
    __typename
    ...PostDetailsFragment
    commentsConnection(
      postId: $postId
      first: $first
      after: $after
      last: $last
      before: $before
      includingAndAfter: $includingAndAfter
    ) {
      __typename
      pageInfo {
        __typename
        ...PageInfoFragment
      }
      edges {
        __typename
        ...PostCommentsEdgeFragment
      }
    }
    commentPostingAccessControlContext {
      __typename
      commentPostingAccess
      canComment
      cannotCommentErrorMessage
    }
  }
}

fragment PaginatedCommentsOutputWithoutCanComment on GetPostResult {
  __typename
  post {
    __typename
    ...PostDetailsFragment
    commentsConnection(
      postId: $postId
      first: $first
      after: $after
      last: $last
      before: $before
      includingAndAfter: $includingAndAfter
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

query paginatedReplies(
  $commentId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $includingAndAfter: String
  $includingAndBefore: String
) {
  getComment(input: { id: $commentId }) {
    __typename
    ...PaginatedRepliesOutput
  }
}

query paginatedComments(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $includingAndAfter: String
) {
  getPost(input: { id: $postId }) { 
    __typename  
    ...PaginatedCommentsOutput
  }
}

query paginatedCommentsWithoutCanCommentStatus(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $includingAndAfter: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ...PaginatedCommentsOutputWithoutCanComment
  }
}

fragment PaginatedFeedOutput on GetFeedResult {
  __typename
  feed {
    __typename
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

query paginatedFeed(
  $getFeedInput: GetFeedInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getFeed(input: $getFeedInput) {
    __typename
    ...PaginatedFeedOutput
  }
}

mutation Repost($postId: ID!) {
  repost(input: { postId: $postId }) {
    __typename
    ... on RepostResult {
      __typename
      post {
        __typename
        ... PostDetailsFragment
      }
    }
  }
}

mutation reactOnPost($reactOnPostInput: ReactOnPostInput!) {
  reactOnPost(input: $reactOnPostInput) {
    __typename
    ... on ReactOnPostResult {
      __typename
      post {
        __typename
        ...PostDetailsFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation pinComment($pinCommentInput: PinCommentInput!) {
  pinComment(input: $pinCommentInput) {
    ... on PinCommentResult {
      post {
        __typename
        id
        ...PostDetailsFragment
        pinnedComment {
        __typename
        ...CommentFragment
        }
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}
mutation followUser($followUserInput: FollowUserInput!) {
  followUser(input: $followUserInput) {
    ... on FollowUserResult {
      currentUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation unfollowUser($unfollowUserInput: UnfollowUserInput!) {
  unfollowUser(input: $unfollowUserInput) {
    ... on UnfollowUserResult {
      __typename
      currentUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation removeFollower($removeFollowerInput: RemoveFollowerInput!) {
  removeFollower(input: $removeFollowerInput) {
    ... on RemoveFollowerResult {
      __typename
      currentUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation addComment($addCommentInput: AddCommentInput!) {
  addComment(input: $addCommentInput) {
    ... on SmartError {
      __typename
      message
    }
    ... on PostNotFoundError {
      __typename
      message
    }
    ... on AddCommentResult {
      __typename
      comment {
        __typename
      	...CommentFragment
      }
      post {
        __typename
        ...PostDetailsFragment
      }
    }
    ... on TrollDetectorError {
      __typename
      message
      data
      indices
    }
  }
}

mutation addReply($addReplyInput: AddReplyInput!) {
  addReply(input: $addReplyInput) {
     __typename
     ... on SmartError {
      __typename
      message
    }
    ... on AddReplyResult {
      __typename
      reply {
        __typename
        ...ReplyFragment
      }
      comment {
        __typename
        ...CommentFragment
      }
    }
  }
}

mutation SharePost($postId: ID!) {
  sharePost(input: { postId: $postId }) {
    __typename
    post {
      __typename
      ...PostDetailsFragment
    }
  }
}

query getUser($getUserInput: GetUserInput!) {
  getUser(input: $getUserInput) {
    ... on GetUserResult {
      __typename
      user {
        __typename
        ...UserFragment
        isAvailable
        isSuspended
        hasBlocked
      }
    }
  }
}
query getCurrentUser($getUserInput: GetUserInput!) {
  getUser(input: $getUserInput) {
    ... on GetUserResult {
      __typename
      user {
        __typename
        ...CurrentUserFragment
      }
    }
  }
}

query paginatedUserPosts(
  $getUserInput: GetUserInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getUser(input: $getUserInput) {
    ... on GetUserResult {
      __typename
      user {
        __typename
        id
        ts {
          __typename
          createdAt
          updatedAt
        }
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
            cursor
            node {
              __typename
              id
              key: id
              ...PostDetailsFragment
            }
          }
        }
      }
    }
  }
}

query getUserDetailsAndPosts(
  $getUserInput: GetUserInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getUser(input: $getUserInput) {
    ... on GetUserResult {
      __typename
      user {
        __typename
        ...UserFragment
        isAvailable
        isSuspended
        hasBlocked
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
            cursor
            node {
              __typename
              key: id
              ...PostDetailsFragment
            }
          }
        }
      }
    }
  }
}

mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    jwtToken
    user {
      __typename
      ...UserFragment
    }
  }
}

mutation signUpWithEmail($signUpWithEmailInput: SignUpWithEmailInput!) {
  signUpWithEmail(input: $signUpWithEmailInput) {
    __typename
    user {
      __typename
      ...UserFragment
    }
    jwtToken
  }
}

mutation updateCommentParticipationType(
  $updateCommentParticipationTypeInput: UpdateCommentParticipationInput!
) {
  updateCommentParticipation(input: $updateCommentParticipationTypeInput) {
    ... on UpdateCommentParticipationResult {
      __typename
      comment {
        __typename
        ...CommentFragment
      }
    }
  }
}

mutation reportComment($reportCommentInput: ReportCommentInput!) {
  reportComment(input: $reportCommentInput) {
    ... on ReportCommentResult {
      __typename
      comment {
        __typename
        ...CommentFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation reportReply($reportReplyInput: ReportReplyInput!) {
  reportReply(input: $reportReplyInput) {
    ... on ReportReplyResult {
      reply {
        ...ReplyFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation reportPost($reportPostInput: ReportPostInput!) {
  reportPost(input: $reportPostInput) {
    ... on ReportPostResult {
      __typename
      post {
        __typename
        ...PostFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation deleteComment($deleteCommentInput: DeleteCommentInput!) {
  deleteComment(input: $deleteCommentInput) {
    ... on DeleteCommentResult {
      __typename
      isSuccessful
      post {
        __typename
        id
        pinnedComment {
        __typename
        ...CommentFragment
        }
        stats {
        __typename
        ...PostStatsFragment
        }
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation deleteReply($deleteReplyInput: DeleteReplyInput!) {
  deleteReply(input: $deleteReplyInput) {
    ... on DeleteReplyResult {
      __typename
      isSuccessful
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

query getPost($getPostInput: GetPostInput!) {
  getPost(input: $getPostInput) {
    ... on GetPostResult {
      __typename
      post {
        __typename
        ...PostDetailsFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation firebaseEmailAuthentication($input: FirebaseAuthEmailInput!) {
  firebaseEmailAuthentication(input: $input) {
    ... on LoginOutput {
      __typename
      jwtToken
      user {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
    ... on AskForHandleAndNameError{
      __typename
      message
    }
  }
}

mutation firebasePhoneNumberAuthentication(
  $input: FirebaseAuthPhoneNumberInput!
) {
  firebasePhoneNumberAuthentication(input: $input) {
    ... on LoginOutput {
      __typename
      jwtToken
      user {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
    ... on AskForHandleAndNameError{
      __typename
      message
    }
  }
}

mutation firebaseSignup($input: FirebaseSignupInput!) {
  firebaseSignup(input: $input) {
    ... on SignUpOutput {
      user {
        __typename
        ...UserFragment
      }
      jwtToken
    }
    ... on SmartError {
      __typename
      message
    }
    ... on HandleAlreadyTakenError{
      __typename
      message
    }
  }
}

mutation getOrDeleteFirebaseUser($uid: String!) {
  getOrDeleteFirebaseUser(uid: $uid) {
    ... on DeleteFirebaseUserResult {
      __typename
      isSuccessful
    }
    ... on SignUpOutput {
      __typename
      user {
        __typename
        ...UserFragment
      }
      jwtToken
    }
  }
}

mutation updateHandle($input: UpdateHandleInput!) {
  updateHandle(input: $input) {
    ... on UpdatedUserResult {
      __typename
      updatedUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation updateName($input: UpdateNameInput!) {
  updateName(input: $input) {
    ... on UpdatedUserResult {
      __typename
      updatedUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation updateEmail($input: UpdateEmailInput!) {
  updateEmail(input: $input) {
    ... on UpdatedUserResult {
      __typename
      updatedUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation updatePhoneNumber($input: UpdatePhoneNumberInput!) {
  updatePhoneNumber(input: $input) {
    ... on UpdatedUserResult {
      __typename
      updatedUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation updateAvatar($input: UpdateUserAvatarInput!) {
  updateAvatar(input: $input) {
    ... on UpdatedUserResult {
      __typename
      updatedUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation removeAvatar($shouldRemove: Boolean!) {
  removeAvatar(shouldRemove: $shouldRemove) {
    ... on UpdatedUserResult {
      __typename
      updatedUser {
        __typename
        ...UserFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation updateFCMToken($input: UpdateFCMTokenInput!) {
  updateFCMToken(input: $input) {
    ... on UpdateFCMTokenStatus {
      __typename
      success
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

query getFollowersList(
  $input: GetFollowersListInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getFollowersList(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on GetFollowersListResult {
      __typename
      user {
        __typename
        id
        followersList(
          first: $first
          after: $after
          last: $last
          before: $before
        ) {
          pageInfo {
            __typename
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          edges {
            __typename
            cursor
            node {
              __typename
              key: id
              id
              name
              handle
              avatarImage {
                __typename
                uri
              }
              realIdVerificationStatus
              realIdFace {
                __typename
                uri
              }
              score
              currentUserContext {
                __typename
                ...UserContextFragment
              }
            }
          }
        }
      }
    }
  }
}

query getFollowingsList(
  $input: GetFollowingsListInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getFollowingsList(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on GetFollowingsListResult {
      user {
        __typename
        id
        followingsList(
          first: $first
          after: $after
          last: $last
          before: $before
        ) {
          pageInfo {
            __typename
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              __typename
              key: id
              id
              name
              handle
              avatarImage {
                __typename
                uri
              }
              realIdVerificationStatus
              realIdFace {
                __typename
                uri
              }
              score
              currentUserContext {
                __typename
                ...UserContextFragment
              }
            }
          }
        }
      }
    }
  }
}

query mentionsSearch($input: ESInput!) {
  elasticSearch(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on ESResult {
      __typename
      result {
        __typename
        ... on User {
          __typename
          id
          name
          handle
          avatarImage {
            __typename
            uri
          }
          realIdVerificationStatus
          realIdFace {
            __typename
            uri
          }
        }
        ... on Tag {
        __typename
          id
          name
          noSpace
        }
      }
    }
  }
}

query postsSearch($input: ESInput!) {
  elasticSearch(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on ESResult {
      __typename
      result {
        ...on MultiMediaPost {
          __typename
          id
          sensitiveStatus
          thumbnail {
            __typename
            ...ImageFragment
          }
          author {
            __typename
            handle
          }
          caption {
            __typename
            ...ContentFragmentJustBody
          }
          properties {
            __typename
            ... on TextPostProperties {
              __typename
              content {
              __typename
                ...ContentFragmentJustBody
              }
            }
            ... on ImagePostProperties {
              __typename
              thumbnail {
                __typename
                ...ImageFragment
              }
            }
            ... on VideoPostProperties {
              __typename
              thumbnail {
                __typename
                ...ImageFragment
              }
            }                      
          }
        }  
      }
    }
  }
}


query usersSearch($input: ESInput!) {
  elasticSearch(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on ESResult {
      __typename
      result {
        ...on User {
          ...UserFragment
        }
      }
    }
  }
}

query tagsSearch($input: ESInput!) {
  elasticSearch(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on ESResult {
      __typename
      result {
        __typename
       ... on Tag {
          __typename
          id
          name
          noSpace
        }
      }
    }
  }
}


query elasticSearch($input: ESInput!) {
  elasticSearch(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on ESResult {
      result {
        __typename
        ... on User {
          __typename
          ...UserFragment
        }
        ... on Tag {
          __typename
          id
          name
          noSpace
        }
        ...on MultiMediaPost {
          __typename
          id
          thumbnail {
            __typename
            ...ImageFragment
          }
          author {
            __typename
            handle
          }
          caption {
            __typename
            ...ContentFragmentJustBody
          }
          properties {
            ... on TextPostProperties {
              __typename
              content {
                __typename
                ...ContentFragmentJustBody
              }
            }
            ... on ImagePostProperties {
              __typename
              thumbnail {
                __typename
                ...ImageFragment
              }
            }
            ... on VideoPostProperties {
              __typename
              thumbnail {
                __typename
                ...ImageFragment
              }
            }                      
          }
        }
      }
    }
  }
}

query paginatedUserActivity(
  $getUserInput: GetUserInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getUser(input: $getUserInput) {
    ... on GetUserResult {
      __typename
      user {
        __typename
        activitiesConnection(
          first: $first
          after: $after
          last: $last
          before: $before
        ) {
          __typename
          pageInfo {
            __typename
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          edges {
            __typename
            cursor
            node {
              __typename
              id
              type
              ts {
                __typename
                createdAt
                updatedAt
              }
              totalCount
              displayStr
              displayBodyStr
              dataPayload
              subjects {
                ... on User {
                  __typename
                  id
                  handle
                  name
                  score
                  avatarImage {
                    __typename
                    uri
                  }
                  realIdVerificationStatus
                  realIdFace {
                    __typename
                    uri
                  }
                  currentUserContext {
                    __typename
                    ...UserContextFragment
                  }
                }
              }
              miscObject {
                __typename
                ...on MultiMediaPost {
                  __typename
                  id
                  properties {
                    ... on TextPostProperties {
                      __typename
                      content {__typename
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
                ... on Comment {
                  __typename
                  id
                  body {
                    body
                  }
                }
                ... on ReviewReportRequest {
                  __typename
                  id
                  readableId
                  createdAt
                  comment
                  updatedAt
                  violatedGuideline
                }
              }
              object {
                __typename
                ... on ImagePost {
                  __typename
                  id
                  thumbnail {
                    __typename
                    source {
                      __typename
                      uri
                    }
                  }
                  caption {
                  __typename
                    body
                  }
                }
                ... on VideoPost {
                  id
                  thumbnail {
                    __typename
                    source {
                      __typename
                      uri
                    }
                  }
                  caption {
                    __typename
                    body
                  }
                }
                ... on TextPost {
                  __typename
                  id
                  content {
                    __typename
                    body
                  }
                }
                ...on MultiMediaPost {
                  __typename
                  sensitiveStatus
                  id
                  properties {
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
                ... on Comment {
                  __typename
                  id
                  body {
                    __typename
                    body
                  }
                }
              }
              objectType
              verb
            }
          }
        }
      }
    }
  }
}



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

fragment ReactorsUserListConnectionFragment on PostReactorsListConnection {
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

query getRealReactorsCount($postId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  getPost(input: { id: $postId }) {
    ...on GetPostResult {
        __typename
        post {
        __typename
        realReactorsUserListConnection(
        postId: $postId
        first: $first
        after: $after
        last: $last
        before: $before
      ) {
        __typename
        count
        }
      }  
    }
  }
}

query getApplaudReactorsCount($postId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  getPost(input: { id: $postId }) {
    ...on GetPostResult {
        __typename
        post {
        __typename
        applaudReactorsUserListConnection( postId: $postId
        first: $first
        after: $after
        last: $last
        before: $before) {
        __typename
        count
        }
      }  
    }
  }
}

query getLikeReactorsCount($postId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  getPost(input: { id: $postId }) {
    ...on GetPostResult {
        __typename
        post {
        __typename
        likeReactorsUserListConnection( postId: $postId
        first: $first
        after: $after
        last: $last
        before: $before) {
        __typename
        count
        }
      }  
    }
  }
}


query paginateRealReactors($postId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  getPost(input: { id: $postId }) {
    ...on GetPostResult {
        __typename
        post {
        __typename
        realReactorsUserListConnection(
        postId: $postId
        first: $first
        after: $after
        last: $last
        before: $before
      ) {
        __typename
        ...ReactorsUserListConnectionFragment
        }
      }  
    }
  }
}

query paginateApplaudReactors($postId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  getPost(input: { id: $postId }) {
    ...on GetPostResult {
        __typename
        post {
        __typename
        applaudReactorsUserListConnection(
        postId: $postId
        first: $first
        after: $after
        last: $last
        before: $before
      ) {
        __typename
        ...ReactorsUserListConnectionFragment
        }
      }  
    }
  }
}

query paginateLikeReactors($postId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
  getPost(input: { id: $postId }) {
    ...on GetPostResult {
        __typename
        post {
        __typename
        likeReactorsUserListConnection(
        postId: $postId
        first: $first
        after: $after
        last: $last
        before: $before
      ) {
        __typename
        ...ReactorsUserListConnectionFragment
        }
      }  
    }
  }
}


mutation blockUser($blockUserInput: BlockUserInput!) {
  blockUser(input: $blockUserInput) {
    ...on BlockUserResult {
      __typename
      isSuccessful
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation unblockUser($unblockUserInput: UnblockUserInput!) {
  unblockUser(input: $unblockUserInput) {
    ...on UnblockUserResult {
      __typename
      isSuccessful
    }
    ... on SmartError {
      __typename
      message
    }
  }
}

mutation deletePost($deletePostInput: DeletePostInput!) {
  deletePost(input: $deletePostInput) {
    ... on DeletePostResult {
      __typename
      post {
        __typename
        id
        willBeDeleted
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}
 mutation  updateCommentEmbargoOnboardingAt($shouldLift: Boolean){
    updateCommentEmbargoOnboardingAt(shouldLift: $shouldLift){
      ... on CommentEmbargoOnboardingLiftedResult{
        __typename
        lifted
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
query checkPhoneNumberAccountExists($phoneNumberInput: PhoneNumberAccountExistInput!){
  checkPhoneNumberAccountExists(input: $phoneNumberInput){
    ...on PhoneNumberAccountExistResult{
      __typename
      phoneNumberAccountExist
    }
  }
}
mutation updateBio($input: UpdateBioInput!) {
    updateBio(input: $input) {
        ... on UpdatedUserResult {
            __typename
            updatedUser {
              __typename
              ...UserFragment
            }
        }
        ... on SmartError {
            __typename
            message
        }
    }
}
mutation updatePronoun($input: UpdatePronounInput!) {
    updatePronoun(input: $input) {
        ... on UpdatedUserResult {
            __typename
            updatedUser {
              __typename
               ...UserFragment
            }
        }
        ... on SmartError {
            __typename
            message
        }
    }
}

    ''';
}
