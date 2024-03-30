class CurrentUserGqlQueries {
  String get paginatedUserActivity => r'''
  
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
        id
        activitiesConnection(
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
                __typename
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
                  currentUserContext {
                    __typename
                    followingUser
                    isInnerCircle
                  }
                }
              }
              miscObject {
                __typename
                ...on MultiMediaPost {
                  __typename
                  id
                  isHiddenOnChallenge
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
                ... on Comment {
                  __typename
                  id
                  body {
                    __typename
                    body
                  }
                }
                ... on Challenge {
                  __typename
                  id
                  name
                  cover {
                    __typename
                    coverImage {
                      __typename
                      thumbnail {
                        __typename
                        source {
                          __typename
                          uri
                        }
                      }
                    }
                    coverImageEnum
                  }
                }
              }
              object {
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
                  isHiddenOnChallenge
                  id
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
                ... on Comment {
                  __typename
                  id
                  body {
                    __typename
                    body
                  }
                }
                ... on Challenge {
                  __typename
                  id
                  name
                  cover {
                    __typename
                    coverImage {
                      __typename
                      thumbnail {
                        __typename
                        source {
                          __typename
                          uri
                        }
                      }
                    }
                    coverImageEnum
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
}
