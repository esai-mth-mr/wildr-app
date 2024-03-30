class ChallengeMutations {
  static const String kPinChallengeEntry = r'''
  mutation PinChallengeEntry($input: PinChallengeEntryInput!) {
    pinChallengeEntry(input: $input) {
      __typename
      ... on PinChallengeEntryResult {
        __typename
        challenge {
          __typename
          id
          name
        }
        entry {
          __typename
          id
          ...on MultiMediaPost {
            __typename
            id
            isPinnedToChallenge
          }
        }
      }
      ... on SmartError {
        __typename
      }
    }
  }
      ''';

  static const String joinChallenge = r'''
  mutation joinChallenge($input: JoinChallengeInput!) {
    joinChallenge(input: $input) {
      ... on JoinChallengeResult {
        __typename
        challenge {
          __typename
          id
          name
          currentUserContext {
            __typename
            hasJoined
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

  static const String leaveChallenge = r'''
  mutation leaveChallenge($input: LeaveChallengeInput!) {
    leaveChallenge(input: $input) {
      ... on LeaveChallengeResult {
        __typename
        challenge {
          __typename
          id
          name
          currentUserContext {
            __typename
            hasJoined
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

  static const String reportChallenge = r'''
        mutation reportChallenge($input: ReportChallengeInput!) {
        reportChallenge(input: $input) {
          ... on ReportChallengeResult {
            __typename
            challenge {
              __typename
              id
              name
            }
            }
          ... on SmartError {
            __typename
            message
          }
        }
      } 
      ''';
}
