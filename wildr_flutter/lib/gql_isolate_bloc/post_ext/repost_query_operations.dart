class RepostQueryOperations {
  final String kRepostMutation = r'''
mutation repost($repostInput: RepostInput!){
  repost(input: $repostInput) {
    ... on SmartError {
      __typename
      message
    }
    ... on TrollDetectorError {
      __typename
      message
      data
      indices
    }
    ... on RepostResult {
      __typename
      post {
        __typename
        id
        author {
          __typename
          handle
        }
        ... on MultiMediaPost {
          __typename
          repostMeta {
            __typename
            count
            isParentPostDeleted
            parentPost {
              __typename
              id
              repostAccessControlContext {
                __typename
                hasReposted
                cannotRepostErrorMessage
                canRepost
              }
              ...on MultiMediaPost {
                __typename
                repostMeta {
                  __typename
                  count
                }
              }
            }
          }
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
    }
  }
}    
    ''';
}
