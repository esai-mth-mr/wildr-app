class FollowUnfollowQueries {
  String get followUserOperationName => 'followUser';

  String get followUserMutation => r'''
mutation followUser($followUserInput: FollowUserInput!) {
  followUser(input: $followUserInput) {
    __typename
    ... on FollowUserResult {
      currentUser {
        __typename
        id
        stats {
          __typename
          followingCount
          followerCount
          postCount
        }
        currentUserContext {
          __typename
          followingUser
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

  String get removeFollowerMutation => r'''
mutation removeFollower($removeFollowerInput: RemoveFollowerInput!) {
  removeFollower(input: $removeFollowerInput) {
    __typename
    ... on RemoveFollowerResult {
      __typename
      currentUser {
        __typename
        id
        stats {
          __typename
          followingCount
          followerCount
          postCount
        }
      }
    }
    ... on SmartError {
      message
    }
  }
}
''';
}
