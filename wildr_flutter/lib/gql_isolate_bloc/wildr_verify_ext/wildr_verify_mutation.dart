class WildrVerifyMutation {
  static const String wildrVerifiedManualReview = r'''
mutation wildrVerifiedManualReview($input: WildrVerifiedManualReviewInput!) {
  wildrVerifiedManualReview(input: $input) {
    __typename
    ... on WildrVerifiedManualReviewResult {
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
}
