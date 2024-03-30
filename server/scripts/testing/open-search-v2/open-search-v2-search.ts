import { client } from '../server-client';

export const openSearchV2Search = async () => {
  console.time('openSearchV2Search');
  const result = await client.post('/graphql', {
    query: /* GraphQL */ `
      query OpenSearch($input: ESInput!) {
        elasticSearch(input: $input) {
          __typename
          ... on ESResult {
            result {
              __typename
              ... on MultiMediaPost {
                id
                caption {
                  segments {
                    ... on Text {
                      chunk
                    }
                  }
                }
                stats {
                  likeCount
                }
              }
              ... on User {
                id
                handle
                name
                stats {
                  followerCount
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      input: {
        type: 'POST',
        query: '',
        useNewSearch: true,
        paginationInput: {
          take: 10,
        },
      },
    },
  });

  console.log(result.data.data.elasticSearch.result);
  console.timeEnd('openSearchV2Search');
};

openSearchV2Search();
