class GqlQueriesProfilePage {
  String updateListVisibility = r'''
    mutation updateListVisibility(
      $updateListVisibilityInput: UpdateListVisibilityInput!
    ) {
      updateListVisibility(input: $updateListVisibilityInput) {
        ... on UpdateListVisibilityResult {
          __typename
          isSuccessful
          user {
                __typename
                id
                visibilityPreferences {
                    __typename
                    list {
                      __typename
                        follower
                        following
                    }
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
  String isEmailVerified = r'''
    query isEmailVerified($isEmailVerifiedInput: String){
      isEmailVerified(input: $isEmailVerifiedInput){
        __typename
        ...on IsEmailVerifiedResult{
            __typename
            isEmailVerified
        }
        ... on SmartError{
            __typename
            message
        }
    }
  }
  ''';
}
