import { gql } from '@apollo/client';

export const SEND_CONTACT_US_EMAIL = gql`
  mutation SendContactUsEmail($input: SendContactUsEmailInput!) {
    sendContactUsEmail(input: $input) {
      __typename
      ... on SendContactUsEmailResult {
        success
      }
      ... on SmartError {
        message
      }
    }
  }
`;
