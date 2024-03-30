import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';
import 'package:wildr_flutter/gql_services/g_service_isolate.dart';

class GQueries {
  static String paginateRepliesQuery() =>
      CreateQuery.createQuery(kPaginatedRepliesQuery, [
        GFragments.kPostStatsFragment,
        GFragments.kUserContextFragment,
        GFragments.kTimestampFragment,
        GFragments.kTagFragment,
        GFragments.kUserFragment,
        GFragments.kCommentFragment,
        //GFragments.kPostFragment,
        GFragments.kContentFragment,
        GFragments.kTextPostFragment,
        GFragments.kImageFragment,
        GFragments.kImagePostFragment,
        GFragments.kMediaSourceFragment,
        GFragments.kVideoFragment,
        GFragments.kVideoPostFragment,
        GFragments.kPageInfoFragment,
        GFragments.kFeedPostsEdgeFragment,
        GFragments.kPaginatedFeedFragment,
        GFragments.kPaginatedFeedOutput,
        GFragments.kPaginatedRepliesOutput,
        GFragments.kCommentRepliesEdgeFragment,
        GFragments.kReplyFragment,
      ]);

  static String paginatedUserPostsQuery() =>
      GServiceIsolate.createQuery(GQueries.kPaginatedUserPosts, [
        GFragments.kPostStatsFragment,
        GFragments.kUserContextFragment,
        GFragments.kTimestampFragment,
        GFragments.kTagFragment,
        GFragments.kUserFragment,
        GFragments.kCommentFragment,
        GFragments.kContentFragment,
        GFragments.kTextPostFragment,
        GFragments.kMultiMediaPostFragment,
        GFragments.kImageFragment,
        GFragments.kImagePostFragment,
        GFragments.kMediaSourceFragment,
        GFragments.kVideoFragment,
        GFragments.kVideoPostFragment,
        GFragments.kPostContextFragment,
        GFragments.kPageInfoFragment,
        // GFragments.kPostDetailsFragment,
      ]);

  static const String kPaginateFeedQuery = r'''
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
  ''';

  static const String kPaginatedCommentsQuery = r'''
  query paginatedComments(
    $postId: ID!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    getPost(input: { id: $postId }) {
      __typename
      ...PaginatedCommentsOutput
    }
  }  
  ''';

  static const String kPaginatedRepliesQuery = r'''
  query paginatedReplies(
    $commentId: ID!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    getComment(input: { id: $commentId }) {
      __typename
      ...PaginatedRepliesOutput
    }
  }
  ''';

  static String getUser() => r'''
  query getUser($getUserInput: GetUserInput!) {
    getUser(input: $getUserInput) {
      __typename
      ... on SmartError {
        __typename
        message
      }
      ... on GetUserResult {
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
          avatarImage {
            __typename
            uri
          }
          realIdFace {
            __typename
            uri
          }
          bio
          pronoun
          hasPersonalizedFeed
          realIdVerificationStatus
          stats {
            __typename
            followingCount
            followerCount
            postCount
          }
          strikeData {
            __typename
            currentStrikeCount
          }
          currentUserContext {
            __typename
            followingUser
            isInnerCircle
          }
           visibilityPreferences{
            __typename
              list{
                  __typename
                  follower
                  following
              }
          }
        }
      }
    }
  }
  ''';

  static String get unfollow => r'''
    
mutation unfollowUser($unfollowUserInput: UnfollowUserInput!) {
  unfollowUser(input: $unfollowUserInput) {
    __typename
    ... on UnfollowUserResult {
      __typename
      currentUser {
        __typename
        id
        stats {
          __typename
          followingCount
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

  static String getCurrentUser() => r'''
  query getUser($getUserInput: GetUserInput!) {
    getUser(input: $getUserInput) {
      __typename
      ... on GetUserResult {
        __typename
        user {
          __typename
          id
          remainingInvitesCount
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
          stats {
            __typename
            followingCount
            followerCount
            postCount
            innerCircleCount
          }
          realIdFace {
            __typename
            uri
          }
          realIdVerificationStatus
          strikeData {
            __typename
            currentStrikeCount
          }
          commentEnabledAt
          commentOnboardedAt
          userCreatedAt
          embargoExpirationDaysDelta
          pronoun
          bio
          hasPersonalizedFeed
          onboardingStats {
            __typename
            innerCircle
            commentReplyLikes
            challenges
            challengeEducation
          }
           visibilityPreferences{
              __typename
              list{
                  __typename
                  follower
                  following
              }
          }
        }
      }
    }
  }
  ''';

  static const String kSearchInputQuery = r'''
  query search($searchInput: SearchInput!) {
    search(input: $searchInput) {
      __typename
      ... on SearchResult {
        __typename
        pageInfo {
          __typename
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        objectType
        result {
          __typename
          cursor
          node {
            __typename
            ... on User {
              __typename
              id
              handle
              name
              isSuspended
              avatarImage {
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
  }  
  ''';

  static const String kPaginateActivitiesQuery = r'''
  query paginatedUserActivity(
    $getUserInput: GetUserInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    getUser(input: $getUserInput) {
      __typename
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
                dataPayload
                subjects {
                  __typename
                  ... on User {
                    __typename
                    id
                    isSuspended
                    handle
                    name
                    avatarImage {
                      __typename
                      uri
                    }
                    currentUserContext {
                      __typename
                      followingUser
                    }
                  }
                }   
                miscObject {
                  __typename
                  ...on ImagePost {
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
                  ...on VideoPost {
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
                  ...on TextPost {
                    __typename
                    id
                    content {
                      __typename
                      body
                    }
                  }
                  ...on Comment {
                    __typename
                    id
                    body {
                      __typename
                      body
                    }
                  }
                }      
                object {
                  __typename
                  ...on ImagePost {
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
                  ...on VideoPost {
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
                  ...on TextPost {
                    __typename
                    id
                    content {
                      __typename
                      body
                    }
                  }
                  ...on Comment {
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
  ''';

  static const String kCheckEmail = r'''
  query checkEmail($email: String!) {
    checkEmail(email: $email) {
      __typename
      ...on CheckEmailResult {
        __typename
        doesExist
      }
    }
  }
  ''';

  static const String kCheckHandle = r'''
  query checkHandle($handle: String!) {
    checkHandle(handle: $handle) {
      __typename
      ...on CheckHandleResult {
        __typename
        doesExist
      }
    }
  }
  ''';
  static const String kCheck3rdParty = r'''
   query check3rdParty($uid: String!, $providerId: String!) {
    check3rdParty(uid: $uid, providerId: $providerId) {
      __typename
      ...on Check3rdPartyResult {
        __typename
        doesExist
      }
    }
  }
  ''';
  static const String kGetDetailsFrom3rdPartyUid = r'''
  query getDetailsFrom3rdPartyUid($uid: String!, $providerId: String!) {
    getDetailsFrom3rdPartyUid(uid: $uid, providerId: $providerId){
    __typename
    ... on Get3rdPartyDetailsResult{
      __typename
      name
      email
    }
    
    }
  }
  ''';

  static String getRealReactorsCount() => r'''
query getRealReactorsCount(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on GetPostResult {
      __typename
      post {
        __typename
        id
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
''';

  static String getApplaudReactorsCount() => r'''
query getApplaudReactorsCount(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on GetPostResult {
      __typename
      post {
        __typename
        id
        __typename
        applaudReactorsUserListConnection(
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
''';

  static String getLikeReactorsCount() => r'''
query getLikeReactorsCount(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on GetPostResult {
      __typename
      post {
        __typename
        id
        likeReactorsUserListConnection(
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

''';

  static String paginateRealReactors() {
    const String query = r'''
query paginateRealReactors(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on GetPostResult {
      __typename
      post {
        __typename
        id
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

''';

    return CreateQuery.createQuery(query, [
      GFragments.kReactorsListEdgeFragment,
      GFragments.kPageInfoFragment,
      GFragments.kReactorsUserListConnectionFragment,
    ]);
  }

  static String paginateApplaudReactors() {
    const String query = r'''
query paginateApplaudReactors(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on GetPostResult {
      __typename
      post {
        __typename
        id
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

''';

    return CreateQuery.createQuery(query, [
      GFragments.kReactorsListEdgeFragment,
      GFragments.kPageInfoFragment,
      GFragments.kReactorsUserListConnectionFragment,
    ]);
  }

  static String paginateLikeReactors() {
    const String query = r'''
query paginateLikeReactors(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on GetPostResult {
      post {
        __typename
        id
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

''';

    return CreateQuery.createQuery(query, [
      GFragments.kReactorsListEdgeFragment,
      GFragments.kPageInfoFragment,
      GFragments.kReactorsUserListConnectionFragment,
    ]);
  }

  static String getInviteCode() => r'''
    query getInviteCode($input: GetInviteCodeInput!) {
      getInviteCode(input: $input) {
        __typename
        ...on SmartError {
          __typename
          message
        }
        ... on GetInviteCodeResult {
          __typename
          code
          user {
            __typename
            remainingInvitesCount
            id
            handle
          }
        }
      }
    }
    ''';

  static String checkAndRedeemInviteCode() => r'''
    query checkAndRedeemInviteCode($input: CheckAndRedeemInviteCodeInput!) {
      checkAndRedeemInviteCode(input: $input) {
        __typename
        ...on SmartError {
          __typename
          message
        }
        ... on CheckAndRedeemInviteCodeResult {
          __typename
          hasBeenRedeemed
          isValid
          payload
        }
      }
    }
    ''';

  static const String kSendEmailVerificationLink = r'''
  query sendEmailVerificationLink($input: String!){
    sendEmailVerificationLink(input: $input){
      __typename
        ...on SendEmailVerificationResult{
          __typename
          isSuccessful
        }
        ... on SmartError{
            __typename
            message
        }
    }
}
  
  ''';

  static const String kPaginatedUserPosts = r'''
query paginatedUserPosts(
  $getUserInput: GetUserInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getUser(input: $getUserInput) {
    __typename
    ... on SmartError {
      __typename
      message
    }
    ... on GetUserResult {
      __typename
      user {
        __typename
        id
        postsConnection(
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
              ... on MultiMediaPost {
                __typename
                isHiddenOnChallenge
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
                id
                willBeDeleted
                sensitiveStatus
                isPrivate
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
                author {
                  __typename
                  id
                  avatarImage {
                    __typename
                    uri
                  }
                  name
                  handle
                  score
                }
                stats {
                  __typename
                  likeCount
                  applauseCount
                  realCount
                  shareCount
                  repostCount
                  commentCount
                }
                ts {
                  __typename
                  createdAt
                  expiry
                  updatedAt
                }
                postContext {
                  __typename
                  liked
                }
                thumbnail {
                  __typename
                  id
                  source {
                    __typename
                    uri
                  }
                }
                caption {
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
                properties {
                  __typename
                  ... on TextPostProperties {
                    __typename
                    content {
                      __typename
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
                  }
                  ... on ImagePostProperties {
                    __typename
                    image {
                      __typename
                      id
                      source {
                        __typename
                        uri
                      }
                      type
                    }
                    thumbnail {
                      __typename
                      id
                      source {
                        __typename
                        uri
                      }
                      type
                    }
                  }
                  ... on VideoPostProperties {
                    __typename
                    video {
                      __typename
                      id
                      source {
                        __typename
                        uri
                      }
                      type
                    }
                    thumbnail {
                      __typename
                      id
                      source {
                        __typename
                        uri
                      }
                      type
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
            }
          }
        }
      }
    }
  }
}
  ''';

  static const String kGetCategories = r'''
  query getCategories($input: String!) {
    getCategories(input: $input) {
      __typename
      ...on GetCategoriesResult {
        __typename
        categories{
          __typename
          id
          value
        }
        userCategoryInterests
      }
      ...on SmartError {
        __typename
        message
      }
    }
  }
  ''';

  static const String kGetCategoriesWithTypes = r'''
        query getCategoriesWithTypes($input: GetCategoriesWithTypesInput!) {
          getCategoriesWithTypes(input: $input) {
            __typename
            ... on GetCategoriesWithTypesResult {
              __typename
              categories {
                __typename
                name
                categories {
                    __typename
                    id
                    value
                }
              }
            }
          }
        }
        ''';

  static const String kGetPostTypes = r'''
  query getPostTypes($input: String!) {
    getPostTypes(input: $input) {
      __typename
      ...on GetPostTypesResult {
        __typename
        postTypes {
          __typename
          value
          name
        }
        userPostTypeInterests
      }
      ...on SmartError {
        __typename
        message
      }      
    }
  }
  ''';

  static const String kGetFeatureFlags = r'''
query getFeatureFlags {
  getFeatureFlags {
    __typename
    ...on FeatureFlagsResult {
      __typename
      createPostV1
      createPostV2
      bannersEnabled
      coinDashboardPart1
      coinDashboardPart2
      videoCompressionRes960x540Quality
    }
    ...on SmartError {
      __typename
      message
    }
  }
}  
  ''';

  static const String kGetBanners = r'''
query getBanners {
  getBanners {
    __typename
    ... on BannersConnection {
      banners {
        __typename
        id
        title
        description
        cta
        asset {
          __typename
          id
          source {
            __typename
            uri
          }
          type
        }
      }
    }
  }
}
  ''';
}
