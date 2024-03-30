import { gql } from '@apollo/client';

export const ADD_EMAIL_TO_WAITLIST = gql`
  mutation AddEmailToWaitlist($input: AddEmailToWaitlistInput!) {
    addEmailToWaitlist(input: $input) {
      ... on AddEmailToWaitlistResult {
        success
      }
      ... on SmartError {
        message
      }
    }
  }
`;
