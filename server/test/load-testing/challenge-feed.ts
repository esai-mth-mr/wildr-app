import autocannon from 'autocannon';

const getChallengesQuery = /* GraphQL */ `
  query GetChallenges($input: GetChallengesInput!) {
    getChallenges(input: $input) {
      ... on GetChallengesResult {
        __typename
        edges {
          cursor
          node {
            id
            name
            isOwner
            isCompleted
            author {
              handle
            }
            stats {
              commentCount
              entryCount
              participantCount
            }
            previewParticipants {
              displayText
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
          pageNumber
          count
          totalCount
        }
      }
      ... on SmartError {
        __typename
        message
      }
    }
  }
`;

async function main() {
  const result = await autocannon({
    url: 'http://wildr-dev-2.us-west-2.elasticbeanstalk.com/graphql',
    connections: 100,
    duration: 240,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query: getChallengesQuery,
      variables: {
        input: {
          type: 'ALL',
          paginationInput: {
            take: 10,
          },
        },
      },
    }),
    overallRate: 16,
  });
  // console.log(result);
}

main();
