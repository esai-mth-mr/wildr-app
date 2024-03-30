class SearchQueries {
  String mentionsSearch = r'''
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
          score
          name
          handle
          avatarImage {
            __typename
            uri
          }
          realIdVerificationStatus
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
  ''';

  String tagSearch = r'''
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
  ''';

  String userSearchQuery = r'''
  query usersSearch($input: ESInput!) {
  elasticSearch(input: $input) {
    ... on SmartError {
      __typename
      message
    }
    ... on ESResult {
      __typename
      result {
        __typename
        ...on User {
          __typename
          id
          name
          handle
          avatarImage {
            __typename
            uri
          }
          realIdFace {
            __typename
            uri
          }
          score
        }
      }
    }
  }
}
  ''';

  String postSearchQuery = r'''
fragment ImageFragment on Image {
  __typename
  id
  source {
    __typename
    uri
  }
  type
}

fragment ContentFragmentJustBody on Content {
  body
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
        ... on MultiMediaPost {
          __typename
          willBeDeleted
          id
          isHiddenOnChallenge
          baseType
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
  
  ''';

  String search = r'''
  
fragment ImageFragment on Image {
  __typename
  id
  source {
    __typename
    uri
  }
  type
}

fragment ContentFragmentJustBody on Content {
  __typename
  body
}  
  
query elasticSearch($input: ESInput!) {
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
          score
          name
          handle
          avatarImage {
            __typename
            uri
          }
          realIdVerificationStatus
        }
        ... on Tag {
          __typename
          id
          name
          noSpace
        }
        ... on MultiMediaPost {
          __typename
          willBeDeleted
          id
          isHiddenOnChallenge
          baseType
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
  ''';
}
