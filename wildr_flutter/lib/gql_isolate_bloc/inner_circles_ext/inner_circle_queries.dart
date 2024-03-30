class GqlQueriesInnerCircle {
  String addMember = r'''
mutation addMemberToInnerCircle($input: AddMemberToInnerCircleInput! ) {
  __typename
  addMemberToInnerCircle(input: $input) {
    __typename
    ...on UpdateListResult {
      __typename
      listDetails {
        __typename
        id
        name
        iconUrl
        memberCount
      }
      owner {
        __typename
        id
        stats {
          __typename
         innerCircleCount 
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

  String removeMember = r'''
mutation removeMemberFromInnerCircle($input: RemoveMemberFromInnerCircleInput! ) {
  removeMemberFromInnerCircle(input: $input) {
    __typename
    ...on UpdateListResult {
      __typename
      listDetails {
        __typename
        id
        name
        iconUrl
        memberCount
      }
      owner {
        __typename
        id
        stats {
          __typename
         innerCircleCount 
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

  String paginate = r'''
query paginateInnerCircleListMembers(
  $getUserInput: GetUserInput!
  $paginationInput: PaginationInput
  $isSuggestion: Boolean
) {
  getUser(input: $getUserInput) {
    ... on GetUserResult {
      __typename
      user {
        __typename
        stats {
          __typename
          followingCount
          followerCount
          innerCircleCount
        }
        innerCircleList(
          paginationInput: $paginationInput
          isSuggestion: $isSuggestion
        ) {
          __typename
          ... on UserListWithMembers {
            __typename
            details {
              __typename
              ... on UserList {
                __typename
                id
                name
                iconUrl
                memberCount
              }
            }
            isSuggestion
            members {
              __typename
              pageInfo {
                __typename
                startCursor
                endCursor
                hasNextPage
                hasPreviousPage
                pageNumber
              }
              edges {
                __typename
                cursor
                node {
                  __typename
                  id
                  name
                  handle
                  avatarImage {
                    __typename
                    uri
                  }
                  score
                  isSuspended
                  currentUserContext {
                    __typename
                    followingUser
                    isInnerCircle
                  }
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
}
