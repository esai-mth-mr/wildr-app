import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

class GQMutations {
  static String createTextPostMutation() => CreateQuery.createQuery(
        GQMutations.kCreateTextPost,
        GFragments.postDetailsFragment,
      );

  static String createImagePostMutation() => CreateQuery.createQuery(
        GQMutations.kCreateImagePost,
        GFragments.postDetailsFragment,
      );

  static String createVideoPostMutation() => CreateQuery.createQuery(
        GQMutations.kCreateVideoPost,
        GFragments.postDetailsFragment,
      );

  static String createAddCommentMutation() => CreateQuery.createQuery(
        GQMutations.kAddComment,
        [GFragments.kCommentFragment],
      );

  static String createReactOnCommentMutation() => CreateQuery.createQuery(
        GQMutations.kReactOnComment,
        [GFragments.kCommentFragment],
      );

  static String createAddReplyMutation() => CreateQuery.createQuery(
        GQMutations.kAddReply,
        [GFragments.kReplyFragment],
      );

  static String createReactOnReplyMutation() => CreateQuery.createQuery(
        GQMutations.kReactOnReply,
        [GFragments.kReplyFragment],
      );

  static const String kReactOnPost = r'''
  mutation reactOnPost($reactOnPostInput: ReactOnPostInput!) {
    reactOnPost(input: $reactOnPostInput) {
      ... on ReactOnPostResult {
        __typename
        challenge {
          __typename
          id
          name
          authorInteractionsConnection() {
            __typename
            interactionCount
          }
        }
        post {
          __typename
          ...on MultiMediaPost {
            __typename
            id,
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
            postContext {
              __typename
              liked
              realed
              applauded
            }
            canComment
            willBeDeleted
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

  static const String kCreateTextPost = r'''
  mutation CreateTextPost($createTextPost: CreateTextPostInput!) {
    createTextPost(input: $createTextPost) {
      __typename
      ... on CreatePostResult {
        __typename
        post {
          __typename
          ...PostDetailsFragment
        }
      }
    }
  }
  ''';

  static const String kCreateImagePost = r'''
  mutation CreateImagePost($createImagePost: CreateImagePostInput!) {
    createImagePost(input: $createImagePost) {
      __typename
      ... on CreatePostResult {
        __typename
        post {
          __typename
          ...PostDetailsFragment
        }
      }
    }
  }
  ''';

  static const String kCreateVideoPost = r'''
  mutation CreateVideoPost($createVideoPost: CreateVideoPostInput!) {
    createVideoPost(input: $createVideoPost) {
      __typename
      ... on CreatePostResult {
        __typename
        post {
          __typename
          ...PostDetailsFragment
        }
      }
    }
  }
  ''';

  static const String kLogin = r'''
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      jwtToken
      user {
        __typename
        id
        handle
      }
    }
  }
  ''';

  static const String kSignUp = r'''
mutation SignUpWithEmail($signUpWithEmailInput: SignUpWithEmailInput!) {
   signUpWithEmail(input: $signUpWithEmailInput) {
      user {
        __typename
        id
        handle
      }
      jwtToken
    }
  }
  ''';

  static const String kDeleteComment = r'''
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
  fragment CommentFragment on Comment {
    __typename
    id
    ts {
      __typename
      createdAt
      updatedAt
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
    commentContext {
      __typename
      liked
    }
    participationType
  }
  mutation deleteComment($deleteCommentInput: DeleteCommentInput!) {
    deleteComment(input: $deleteCommentInput) {
      ... on DeleteCommentResult {
        __typename
        isSuccessful
        post {
          __typename
          id
          willBeDeleted
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
          pinnedComment {
            __typename
            ...CommentFragment
          }
          ... on MultiMediaPost {
            __typename
            id
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

  static const String kAddComment = r'''
fragment AuthorFragment on User {
  __typename
  id
  handle
  avatarImage {
    __typename
    uri
  }
  score
  isSuspended
  strikeData {
    __typename
    isFaded
    currentStrikeCount
  }
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
      challenge {
        __typename
        id
        name
        authorInteractionsConnection() {
          __typename
          interactionCount
        }
      }    
      comment {
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
        commentContext {
          __typename
          liked
        }
        participationType
      }
      post {
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
        willBeDeleted
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
 
  ''';

  static const String kPinComment = r'''
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

fragment UserFragment on User {
  __typename
  id
  handle
  name
  avatarImage {
    __typename
    uri
  }
  isSuspended
  score
}

fragment CommentFragment on Comment {
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
mutation pinComment($pinCommentInput: PinCommentInput!) {
  pinComment(input: $pinCommentInput) {
    __typename
    ... on PinCommentResult {
      challenge {
        __typename
        id
        name
        authorInteractionsConnection() {
          __typename
          interactionCount
        }
      }
      post {
        __typename
        id
        pinnedComment {
        __typename
        ...CommentFragment
        }
      }
      challenge{
        __typename
        id
        name
        pinnedComment{
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
 
  ''';

  static const String kPinCommentOnChallenge = r'''
    mutation PinCommentOnChallenge($input: PinCommentOnChallengeInput!) {
      pinCommentOnChallenge(input: $input) {
        ... on PinCommentOnChallengeResult {
          __typename
          challenge {
            __typename
            id
          }
          pinnedComment {
            __typename
            id
          }
        }
        ... on SmartError {
          __typename
          message
        }
      }
    }
  ''';

  static const String kReactOnComment = r'''
  mutation ReactOnComment($reactOnCommentInput:ReactOnCommentInput!){
    reactOnComment(input:$reactOnCommentInput) {
      ...on ReactOnCommentResult {
        __typename
        challenge {
          __typename
          id
          name
          authorInteractionsConnection() {
            __typename
            interactionCount
          }
        }
        comment {
          __typename
          id
          commentContext {
            __typename
            liked
          }
          commentStats {
            __typename
            likeCount
          }
        }
      }
      ...on SmartError {
        __typename
        message
      }
    }
  }
  ''';

  static const String kAddReply = r'''
  mutation AddReply($addReplyInput: AddReplyInput!) {
    addReply(input: $addReplyInput) {
      __typename
      ... on AddReplyResult {
        __typename
        challenge {
          __typename
          id
          name
          authorInteractionsConnection() {
            __typename
            interactionCount
          }
        }
        reply {
          __typename
          ...ReplyFragment
        }
      }
      ...on SmartError {
        __typename
        message
      }
    }
  }
  ''';

  static const String kReactOnReply = r'''
  mutation ReactOnReply($reactOnReplyInput:ReactOnReplyInput!){
    reactOnReply(input:$reactOnReplyInput) {
      ...on ReactOnReplyResult {
        __typename
        challenge {
          __typename
          id
          name
          authorInteractionsConnection() {
            __typename
            interactionCount
          }
        }
        reply {
          __typename
          id
          replyContext {
            __typename
            liked
          }
          replyStats {
            __typename
            likeCount
          }
        }
      }
      ...on SmartError {
      __typename
        message
      }
    }
  }
  ''';

  static const String kRequestDeleteUser = r'''
    mutation  requestDeleteUser($requestDelete: Boolean){
      requestDeleteUser(requestDelete: $requestDelete){
        ... on RequestDeleteUserResult{
          __typename
          deleteRequestAccepted
        }
        ... on SmartError {
          __typename
          message
        }
      }
    }
  ''';

  static const String kDeleteReply = r'''
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
''';

  static const String kReportUser = r'''
  mutation reportUser($reportUserInput: ReportUserInput!) {
    reportUser(input: $reportUserInput) {
      ... on ReportUserResult {
        __typename
        user {
          __typename
          id
          score
          isAvailable
          isSuspended
          hasBlocked
          handle
          name
          email
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
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
  ''';

  static const String kReportComment = r'''
  mutation reportComment($reportCommentInput: ReportCommentInput!) {
    reportComment(input: $reportCommentInput) {
      ... on ReportCommentResult {
        __typename
        comment {
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
            hasBlocked
          }
          body {
            __typename
            body
          }
          commentStats {
            __typename
            replyCount
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

  static const String kReportReply = r'''
  mutation reportReply($reportReplyInput: ReportReplyInput!) {
    reportReply(input: $reportReplyInput) {
      ... on ReportReplyResult {
        __typename
        reply {
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
          }
          body {
            __typename
            body
          }
          replyStats {
            __typename
            likeCount
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

  static const String kReportPost = r'''
  mutation reportPost($reportPostInput: ReportPostInput!) {
    reportPost(input: $reportPostInput) {
      ... on ReportPostResult {
        __typename
        post {
          __typename
          id
          stats {
            __typename
            likeCount
            applauseCount
            realCount
            shareCount
            repostCount
            commentCount
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
  static const String kUpdateRealIdStatus = r'''
    mutation updateRealIdStatus(
      $updateRealIdVerificationInput: UpdateRealIdVerificationInput!
    ) {
      updateRealIdStatus(input: $updateRealIdVerificationInput) {
        ... on UpdateRealIdVerificationResult {
          __typename
          message
        }
        ... on SmartError {
          __typename
          message
        }
      }
    }
    ''';

  static const String kUpdateLastSeenCursor = r'''
    mutation updateLastSeenCursor($input: UpdateLastSeenCursorInput!) {
      updateLastSeenCursor(input: $input) {
        __typename
        ...on UpdateLastSeenCursorOutput {
          __typename
          isSuccessful
        }
      }
    }
    ''';

  static const String kUpdateExploreFeedLastSeenCursor = r'''
    mutation updateExploreFeedLastSeenCursor($input: UpdateLastSeenCursorInput!) {
      updateLastSeenCursor(input: $input) {
        __typename
        ...on UpdateLastSeenCursorOutput {
          __typename
          isSuccessful
        }
      }
    }
    ''';

  static const String kUpdateCategories = r'''
    mutation updateCategories($input: UpdateCategoryInterestsInput!) {
      updateCategoryInterests(input: $input) {
        __typename
        ... on SmartError {
          __typename
          message
        }
        ... on UpdateCategoryInterestsResult {
          __typename
          success
        }
      }
    }
    ''';

  static const String kUpdatePostTypes = r'''
  mutation updatePostTypes($input: UpdatePostTypeInterestsInput!) {
    updatePostTypeInterests(input: $input) {
      __typename
      ...on SmartError {
        __typename
        message
      }
      ...on UpdatePostTypeInterestsResult {
        __typename
        success
      }
    }
  }
  ''';

  static const String kCreateChallenge = r'''
fragment ContentFragment on Content {
  __typename
  body
  segments {
    __typename
    ... on Text {
      __typename
      chunk
      lang {
        __typename
        code
      }
    }
    ... on Tag {
      __typename
      id
      name
    }
    ... on User {
      __typename
      id
      handle
    }
  }
}

fragment AuthorFragment on User {
  __typename
  id
  handle
  avatarImage {
    __typename
    uri
  }
  score
  isSuspended
  strikeData {
    __typename
    isFaded
    currentStrikeCount
  }
}

fragment ImageMediaFragment on Image {
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
      __typename
      ...ImageMediaFragment
    }
    thumbnail {
      __typename
      ...ImageMediaFragment
    }
  }
  coverImageEnum
}

fragment ChallengeTimestamps on Timestamps {
  __typename
  createdAt
  updatedAt
  start
  expiry
}

mutation createChallenge($input: CreateChallengeInput!) {
  createChallenge(input: $input) {
    __typename
    ... on CreateChallengeResult {
      __typename
      challenge {
        __typename
        id
        name
        description {
          __typename
          ...ContentFragment
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
    }
    ... on ChallengeTrollDetectionError {
      __typename
      message
      description {
        __typename
        message
        result
      }
      name {
        __typename
        message
        result
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}
  ''';

  static const String kCheckTroll = r'''
mutation detectTrolling($input: DetectTrollingInput!) {
  detectTrolling(input: $input) {
    ... on DetectTrollingResult {
      __typename
      isTroll
      trollDetectionData {
        __typename
        result
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}
  ''';

  static const String kAddUserToWildrCoinWaitlist = r'''
mutation addUserToWaitlist($input: AddUserToWaitlistInput!) {
     addUserToWaitlist(input: $input) {
        ... on AddUserToWaitlistResult{
          __typename
          success
        }
        ... on SmartError {
          __typename
          message
        }
      }
      }
  ''';

  static const String kSkipBanner = r'''
mutation skipBanner($input: SkipBannerInput!) {
     skipBanner(input: $input) {
        ... on SkipBannerResult{
          __typename
          success
        }
        ... on SmartError {
          __typename
          message
        }
      }
      }
  ''';
}
