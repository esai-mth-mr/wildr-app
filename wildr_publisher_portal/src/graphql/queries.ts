import { gql } from '@apollo/client';

export const FIREBASE_SIGNUP = gql`
  mutation firebaseSignup($input: FirebaseSignupInput!) {
    firebaseSignup(input: $input) {
      __typename
      ... on SignUpOutput {
        jwtToken
        user {
          id
        }
      }
      ... on SmartError {
        message
      }
      ... on HandleAlreadyTakenError {
        message
      }
      ... on AskForHandleAndNameError {
        message
      }
    }
  }
`;

export const FIREBASE_EMAIL_AUTHENTICATION = gql`
  mutation firebaseEmailAuthentication($input: FirebaseAuthEmailInput!) {
    firebaseEmailAuthentication(input: $input) {
      __typename
      ... on LoginOutput {
        jwtToken
        user {
          id
        }
      }
      ... on SmartError {
        message
      }
      ... on AskForHandleAndNameError {
        message
      }
    }
  }
`;

export const CREATE_TEXT_POST = gql`
  mutation createTextPost($input: CreateTextPostInput!) {
    createTextPost(input: $input) {
      __typename
      ... on CreatePostResult {
        post {
          id
        }
      }
      ... on SmartError {
        message
      }
      ... on TrollDetectorError {
        message
      }
    }
  }
`;

export const GET_USER = gql`
  query getUser($input: GetUserInput!) {
    getUser(input: $input) {
      __typename
      ... on GetUserResult {
        user {
          id
          bio
          name
          email
          phoneNumber
          avatarImage {
            uri
          }
          stats {
            followerCount
            followingCount
            postCount
            innerCircleCount
            joinedChallengesCount
          }
        }
      }
      ... on SmartError {
        message
      }
    }
  }
`;

export const FIREBASE_PHONE_NUMBER_AUTHENTICATION = gql`
  mutation firebasePhoneNumberAuthentication(
    $input: FirebaseAuthPhoneNumberInput!
  ) {
    firebasePhoneNumberAuthentication(input: $input) {
      __typename
      ... on LoginOutput {
        jwtToken
        user {
          id
        }
      }
      ... on AskForHandleAndNameError {
        message
      }
      ... on SmartError {
        message
      }
    }
  }
`;
