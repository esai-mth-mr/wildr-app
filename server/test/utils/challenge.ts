import {
  ChallengeAuthorInteractionListType,
  ChallengeState,
} from '@verdzie/server/generated-graphql';
import { client } from '@verdzie/test/test-client';

export async function createChallenge({ jwt }: { jwt?: string }) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation createChallenge($input: CreateChallengeInput!) {
          createChallenge(input: $input) {
            __typename
            ... on CreateChallengeResult {
              __typename
              challenge {
                __typename
                id
                name
                isCompleted
              }
            }
            ... on ChallengeTrollDetectionError {
              __typename
              message
              description {
                message
                result
              }
              name {
                message
                result
              }
            }
            ... on SmartError {
              __typename
              message
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Challenge 1',
          description: {
            textSegments: [
              {
                position: 0,
                text: {
                  chunk: 'Description',
                },
              },
            ],
            segments: [
              {
                position: 0,
                segmentType: 'TEXT',
              },
            ],
          },
          cover: {
            coverEnum: 'TYPE_1',
          },
          challengeLengthInDays: 10,
          categoryIds: ['potato1'],
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.createChallenge;
}

export async function getChallenge({
  jwt,
  challengeId,
}: {
  jwt: string;
  challengeId: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query GetChallenge($getChallengeInput: GetChallengeInput!) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                __typename
                id
                name
                pinnedComment {
                  __typename
                  id
                }
                commentVisibilityAccessControlContext {
                  canViewComment
                }
                commentPostingAccessControlContext {
                  canComment
                }
                stats {
                  commentCount
                }
                previewParticipants {
                  displayText
                }
              }
            }
          }
        }
      `,
      variables: {
        getChallengeInput: {
          id: challengeId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.getChallenge;
}

export async function getChallengeWithAuthorInteractions({
  jwt,
  challengeId,
}: {
  jwt: string;
  challengeId: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query getChallengeWithAuthorInteractions(
          $getChallengeInput: GetChallengeInput!
          $listType: ChallengeAuthorInteractionListType!
          $timezone: String!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                __typename
                id
                name
                authorInteractionsConnection(
                  listType: $listType
                  timezone: $timezone
                ) {
                  interactionCount
                }
              }
            }
          }
        }
      `,
      variables: {
        getChallengeInput: {
          id: challengeId,
        },
        listType: ChallengeAuthorInteractionListType.TODAY,
        timezone: 'UTC',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.getChallenge;
}

export async function addCommentToChallenge({
  challengeId,
  jwt,
}: {
  challengeId: string;
  jwt: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation CommentOnChallenge($createCommentInput: AddCommentInput!) {
          addComment(input: $createCommentInput) {
            ... on AddCommentResult {
              comment {
                id
              }
            }
          }
        }
      `,
      variables: {
        createCommentInput: {
          challengeId,
          content: {
            segments: {
              position: 0,
              segmentType: 'TEXT',
            },
            textSegments: {
              position: 0,
              text: {
                chunk: 'Hi',
                langCode: 'en',
                noSpace: true,
              },
            },
          },
          participationType: 'OPEN',
          shouldBypassTrollDetection: true,
          negativeConfidenceCount: 0.0,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.addComment;
}

export async function getJoinedChallenges({
  jwt,
  state,
}: {
  jwt: string;
  state?: ChallengeState;
}) {
  const result = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query GetJoinedChallenges($input: GetJoinedChallengesInput!) {
          getJoinedChallenges(input: $input) {
            ... on GetJoinedChallengesResult {
              __typename
              challenges {
                id
              }
            }
            ... on SmartError {
              __typename
              message
            }
          }
        }
      `,
      variables: {
        input: {
          ...(state && { challengeState: state }),
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return result.data.data.getJoinedChallenges;
}
