class OnboardingGQLQueries {
  String get skip => r'''
mutation skipOnboarding($input: UpdateOnboardingInput!) {
  skipOnboarding(input: $input){
    ...on OnboardingStats {
      __typename
      innerCircle
      commentReplyLikes
      challenges
      challengeEducation
    }
    ...on SmartError {
      __typename
      message
    }
  }
}
  ''';

  String get finish => r'''
mutation finishOnboarding($input: UpdateOnboardingInput!) {
  finishOnboarding(input: $input){
    ...on OnboardingStats {
      __typename
      innerCircle
      commentReplyLikes
      challenges
      challengeEducation
    }
    ...on SmartError {
      __typename
      message
    }
  }
}
  ''';
}
